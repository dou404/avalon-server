import { Server, Socket } from "socket.io";
import { roleSets } from "../constants/RoleSet";
import shuffle from "../utils/shuffle";
import dotenv from "dotenv";

dotenv.config();

interface Room {
  key: string;
  roomName: string;
  hostId: string;
  maxPlayer: number;
  createdAt: number;
  isInProgress: boolean;
}

interface RoomData {
  room: Room;
  players: Socket[];
}

const roomPlayers = new Map<string, RoomData>();

const validRoomKeys = process.env.VALID_ROOM_KEYS?.split(",") || [];

const getRoomListArray = () => {
  const roomArray = Array.from(roomPlayers.values()).map(
    ({ room, players }) => ({
      key: room.key,
      roomName: room.roomName,
      hostId: room.hostId,
      maxPlayer: room.maxPlayer,
      isInProgress: room.isInProgress,
      createdAt: room.createdAt,
      players: players.map((p) => ({ id: p.id, userName: p.data.userName })),
    })
  );

  return roomArray.sort((a, b) => b.createdAt - a.createdAt);
};

const getRoomByRoomName = (roomName: string, hostId?: string) => {
  const room = roomPlayers.get(roomName);

  if (room) {
    return {
      key: room.room.key,
      roomName: room.room.roomName,
      hostId: room.room.hostId,
      maxPlayer: room.room.maxPlayer,
      isInProgress: room.room.isInProgress,
      createdAt: room.room.createdAt,
      players: room.players.map((p) => ({
        id: p.id,
        userName: p.data.userName,
      })),
      isHost: hostId && room.room.hostId === hostId,
    };
  }
};

const getAllUsernames = () => {
  const userNames = new Set<string>();

  for (const roomData of roomPlayers.values()) {
    for (const socket of roomData.players) {
      const userName = socket.data.userName;
      userNames.add(userName);
    }
  }

  return [...userNames];
};

export function registerSocketEvents(io: Server, socket: Socket) {
  socket.on("register", ({ userName }, callback) => {
    if (!userName) {
      return callback?.({
        success: false,
        message: "Failed to register!",
      });
    }

    const connectedUsernames = getAllUsernames();
    if (connectedUsernames.includes(userName)) {
      return callback?.({
        success: false,
        message: "Use your true name, not someone else's!",
      });
    }

    socket.data.userName = userName;

    console.log(`✅ Player joined: ${userName}`);

    return callback?.({ success: true });
  });

  const updateRoom = () => {
    io.emit("room-update", getRoomListArray());
  };

  socket.on("get-room-list", (callback) => {
    return callback(getRoomListArray());
  });

  socket.on("create-room", ({ roomName, maxPlayer, key }, callback) => {
    if (roomPlayers.has(roomName)) {
      return callback?.({ success: false, message: "Room already exists!" });
    }

    if (!validRoomKeys.some((validKey) => validKey === key)) {
      return callback?.({
        success: false,
        message:
          "Invalid key! Please try again or contact the owner of the game!",
      });
    }

    if (getRoomListArray().some((r) => r.key === key)) {
      return callback?.({ success: false, message: "Key is already in use!" });
    }

    const newRoom: Room = {
      key,
      roomName,
      hostId: socket.id,
      maxPlayer,
      isInProgress: false,
      createdAt: Date.now(),
    };

    roomPlayers.set(roomName, {
      room: newRoom,
      players: [socket],
    });

    updateRoom();

    return callback?.({
      success: true,
      room: getRoomByRoomName(roomName),
    });
  });

  socket.on("join-room", ({ roomName }, callback) => {
    const roomData = roomPlayers.get(roomName);
    if (!roomData) {
      return callback?.({ success: false, message: "Room does not exist!" });
    }

    const room = getRoomByRoomName(roomName, socket.id);

    if (roomData.players.find((s) => s.id === socket.id)) {
      return callback({
        success: true,
        room: room,
      });
    }

    if (roomData.players.length >= roomData.room.maxPlayer) {
      callback?.({ success: false, message: "Room is full!" });
      return;
    }

    if (!roomData.players.some((p) => p.id === socket.id)) {
      roomData.players.push(socket);
      socket.join(roomName);
      updateRoom();
    }

    return callback?.({
      success: true,
      room: room,
    });
  });

  socket.on("leave-room", ({ roomName, player }, callback) => {
    const roomData = roomPlayers.get(roomName);

    if (!roomData) {
      return callback?.({ success: false, message: "Room does not exist!" });
    }

    const index = roomData.players.findIndex((p) => p.id === player);
    if (index !== -1) {
      roomData.players.splice(index, 1);
      socket.leave(roomName);

      if (roomData.players.length === 0 || roomData.room.hostId === player) {
        roomPlayers.delete(roomName);

        if (roomData.room.hostId === player) {
          io.to(roomName).emit("room-dismiss");
          io.in(roomName).socketsLeave(roomName);
        }
      }

      updateRoom();

      return callback?.({ success: true });
    } else {
      return callback?.({
        success: false,
        message: "You are not in the room.",
      });
    }
  });

  // Assign roles to players in room
  socket.on("start-game", ({ roomName }, callback) => {
    if (socket.id !== roomPlayers.get(roomName)?.room.hostId) return;

    const roomData = roomPlayers.get(roomName);
    if (!roomData) return;

    const players = roomData.players;
    const roleSet = roleSets[players.length];

    if (!roleSet) {
      callback?.({
        success: false,
        message: "Insufficient player for the game!",
      });
      return;
    }

    roomData.room.isInProgress = true;
    updateRoom();

    const shuffledRoles = shuffle(roleSet);

    players.forEach((playerSocket, i) => {
      playerSocket.emit("role-assigned", { role: shuffledRoles[i] });
    });
  });

  socket.on("end-game", ({ roomName }) => {
    const roomData = roomPlayers.get(roomName);
    if (!roomData) return;

    roomData.room.isInProgress = false;

    const hostRoom = getRoomByRoomName(roomName, socket.id);
    io.to(socket.id).emit("game-finished", { room: hostRoom });

    const room = getRoomByRoomName(roomName);
    io.to(roomName).except(socket.id).emit("game-finished", { room });

    return;
  });

  socket.on("disconnect", () => {
    for (const [roomName, roomData] of roomPlayers.entries()) {
      const index = roomData.players.indexOf(socket);
      if (index !== -1) {
        roomData.players.splice(index, 1);

        if (roomData.players.length === 0) {
          roomPlayers.delete(roomName);
        }

        console.log("❌ Disconnected: ", socket.id);
        break;
      }
    }
  });
}

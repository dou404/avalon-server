import { Server, Socket } from "socket.io";
import { roleSets } from "../constants/RoleSet";
import shuffle from "../utils/shuffle";

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

const validRoomKeys = process.env.VALID_ROOM_KEYS?.split(",") || [];

const roomPlayers = new Map<string, RoomData>();

const getRoomListArray = () => {
  const roomArray = Array.from(roomPlayers.values()).map(
    ({ room, players }) => ({
      key: room.key,
      roomName: room.roomName,
      hostId: room.hostId,
      maxPlayer: room.maxPlayer,
      isInProgress: room.isInProgress,
      createdAt: room.createdAt,
      players: players.map((p) => p.id),
    })
  );

  return roomArray.sort((a, b) => b.createdAt - a.createdAt);
};

const getRoomByRoomName = (roomName: string) => {
  const room = roomPlayers.get(roomName);
  if (room)
    return {
      key: room.room.key,
      roomName: room.room.roomName,
      hostId: room.room.hostId,
      maxPlayer: room.room.maxPlayer,
      isInProgress: room.room.isInProgress,
      createdAt: room.room.createdAt,
      players: room.players.map((p) => p.id),
    };
};

export function registerSocketEvents(io: Server, socket: Socket) {
  const updateRoom = () => {
    io.emit("room-update", getRoomListArray());
  };

  // Send room list to requester
  socket.on("get-room-list", (callback) => {
    callback(getRoomListArray());
  });

  // Create a new room
  socket.on("create-room", ({ roomName, maxPlayer, key }, callback) => {
    if (roomPlayers.has(roomName)) {
      callback?.({ success: false, message: "Room already exists!" });
      return;
    }

    if (!validRoomKeys.some((validKey) => validKey === key)) {
      callback?.({
        success: false,
        message:
          "Invalid key! Please try again or contact the owner of the game!",
      });
      return;
    }

    if (getRoomListArray().some((r) => r.key === key)) {
      callback?.({ success: false, message: "Key is already in use!" });
      return;
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

    callback?.({
      success: true,
      room: getRoomByRoomName(roomName),
    });
  });

  // Join an existing room
  socket.on("join-room", ({ roomName }, callback) => {
    const roomData = roomPlayers.get(roomName);
    if (!roomData) {
      callback?.({ success: false, message: "Room does not exist!" });
      return;
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

    const room = getRoomByRoomName(roomName);

    callback?.({
      success: true,
      room: {
        ...room,
        isHost: room?.hostId === socket.id ? true : false,
      },
    });
  });

  socket.on("leave-room", ({ roomName, player }, callback) => {
    const roomData = roomPlayers.get(roomName);

    if (!roomData) {
      callback?.({ success: false, message: "Room does not exist!" });
      return;
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

      callback?.({ success: true });
    } else {
      callback?.({ success: false, message: "You are not in the room." });
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

  socket.on("end-game", ({ roomName }, callback) => {
    if (socket.id !== roomPlayers.get(roomName)?.room.hostId) return;

    const roomData = roomPlayers.get(roomName);
    if (!roomData) return;

    roomData.room.isInProgress = false;
    callback?.({ success: true });
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

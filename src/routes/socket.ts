import { Server, Socket } from "socket.io";
import { roleSets } from "../constants/RoleSet";
import shuffle from "../utils/shuffle";
import dotenv from "dotenv";

dotenv.config();

const userSocketMap = new Map<string, Socket>();

interface Room {
  key: string;
  roomName: string;
  hostUserName: string;
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

const getRoomListArray = () =>
  Array.from(roomPlayers.values()).map(({ room, players }) => ({
    ...room,
    players: players.map((p) => ({
      id: p.id,
      userName: p.data.userName,
    })),
  }));

const getRoomByRoomName = (roomName: string, hostUserName?: string) => {
  const room = roomPlayers.get(roomName);
  if (!room) return;

  return {
    ...room.room,
    players: room.players.map((p) => ({
      id: p.id,
      userName: p.data.userName,
    })),
    isHost: hostUserName && room.room.hostUserName === hostUserName,
  };
};

export function registerSocketEvents(io: Server) {
  io.on("connection", (socket) => {
    const userName = socket.handshake.query.userName as string;
    const isNew = socket.handshake.query.isNew as string;

    if (!userName || typeof userName !== "string") {
      return socket.disconnect(true);
    }

    const existingSocket = userSocketMap.get(userName);

    if (existingSocket) {
      if (isNew === "TRUE") {
        return socket.emit("register-username", {
          success: false,
          message: "Please use your true name, not someone else's!",
        });
      }

      if (existingSocket.id !== socket.id) {
        console.log(
          `🔁 Reconnection detected for ${userName}. Replacing old socket.`
        );
        existingSocket.disconnect(true);
      }
    }

    socket.data.userName = userName;
    userSocketMap.set(userName, socket);
    console.log(`✅ ${userName} connected with ID ${socket.id}`);

    socket.emit("register-username", { success: true });

    const updateRoom = () => io.emit("room-update", getRoomListArray());

    socket.on("get-room-list", (callback) => {
      if (typeof callback === "function") {
        callback({ roomList: getRoomListArray() });
      }
    });

    socket.on("get-room-details", ({ roomName }, callback) => {
      return callback?.({ room: getRoomByRoomName(roomName, userName) });
    });

    socket.on("create-room", ({ roomName, maxPlayer, key }, callback) => {
      if (roomPlayers.has(roomName)) {
        return callback?.({ success: false, message: "Room already exists!" });
      }

      if (!validRoomKeys.includes(key)) {
        return callback?.({
          success: false,
          message: "Invalid key! Please try again or contact the owner.",
        });
      }

      if (getRoomListArray().some((r) => r.key === key)) {
        return callback?.({
          success: false,
          message: "Key is already in use!",
        });
      }

      const newRoom: Room = {
        key,
        roomName,
        hostUserName: userName,
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

      const room = getRoomByRoomName(roomName, userName);
      if (roomData.players.find((s) => s.data.userName === userName)) {
        updateRoom();
        return callback?.({ success: true, room });
      }

      if (roomData.players.length >= roomData.room.maxPlayer) {
        return callback?.({ success: false, message: "Room is full!" });
      }

      roomData.players.push(socket);
      socket.join(roomName);
      updateRoom();

      return callback?.({ success: true, room });
    });

    socket.on(
      "leave-room",
      ({ roomName, userName: playerUserName }, callback) => {
        const roomData = roomPlayers.get(roomName);
        if (!roomData) {
          return callback?.({
            success: false,
            message: "Room does not exist!",
          });
        }

        const index = roomData.players.findIndex(
          (p) => p.data.userName === playerUserName
        );

        if (index !== -1) {
          roomData.players.splice(index, 1);
          socket.leave(roomName);

          if (
            roomData.players.length === 0 ||
            roomData.room.hostUserName === playerUserName
          ) {
            roomPlayers.delete(roomName);
            if (roomData.room.hostUserName === playerUserName) {
              io.to(roomName).emit("room-dismiss");
              io.in(roomName).socketsLeave(roomName);
            }
          }

          updateRoom();
          return callback?.({ success: true });
        }

        return callback?.({
          success: false,
          message: "You are not in the room.",
        });
      }
    );

    socket.on("start-game", ({ roomName }, callback) => {
      const roomData = roomPlayers.get(roomName);
      if (!roomData || roomData.room.hostUserName !== userName) return;

      const players = roomData.players;
      const roleSet = roleSets[players.length];

      if (!roleSet) {
        return callback?.({
          success: false,
          message: "Insufficient players for the game!",
        });
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

      const hostRoom = getRoomByRoomName(roomName, userName);
      io.to(socket.id).emit("game-finished", { room: hostRoom });

      const room = getRoomByRoomName(roomName);
      io.to(roomName).except(socket.id).emit("game-finished", { room });
    });

    socket.on("disconnect", () => {
      const mappedSocket = userSocketMap.get(userName);
      if (mappedSocket?.id === socket.id) {
        userSocketMap.delete(userName);
      }

      for (const [roomName, roomData] of roomPlayers.entries()) {
        const index = roomData.players.findIndex(
          (p) => p.data.userName === userName
        );
        if (index !== -1) {
          roomData.players.splice(index, 1);

          if (roomData.players.length === 0) {
            roomPlayers.delete(roomName);
          }

          updateRoom();
          break;
        }
      }

      console.log("❌ Disconnected:", socket.id);
    });
  });
}

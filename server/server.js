const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

// 存储客户端的玩家信息
const players = {};
let users = []; // 存储玩家信息

// 静态文件托管
app.use(express.static("public"));

// 棋盘状态（一个简单的示例棋盘，可以根据实际需求扩展）
let boardState = Array(100).fill(null); // 示例：100格棋盘

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  let playerRole = "Spectator";

  // 分配玩家 ID（可以用颜色区分）
  const playerId = socket.id; // 使用 socket ID 作为玩家 ID
  players[socket.id] = { id: playerId, color: "green", role: playerRole }; // 随机颜色
  let i = 0;
  for (const key in players) {
    if (i == 0) {
      players[key].role = "Player_1";
    }
    if (i == 1) {
      players[key].role = "Player_2";
    }
    if (players.hasOwnProperty(key)) {
      console.log(`Key: ${key} PlayerID: ${players[key].id} PlayerRole: ${players[key].role} i: ${i}`);
    }
    i++;
  }

  // 发送初始棋盘状态和玩家信息
  socket.emit("initBoard", { boardState, playerInfo: players[socket.id] });

  // 监听麻将牌移动操作
  socket.on("moveTile", (data) => {
    const { index, tile, playerRole } = data;

    // 更新棋盘状态
    boardState[index] = { tile, playerRole }; // 保存玩家信息

    // 广播更新给其他客户端
    socket.broadcast.emit("updateBoard", { index, tile, playerRole });
  });

  // 玩家断开时清理
  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
    if (players[socket.id].role != "Spectator") {
      boardState = Array(100).fill(null); 
      delete players[socket.id];
      let i = 0;
      for (const key in players) {
        if (i == 0) {
          players[key].role = "Player_1";
          io.to(players[key].id).emit("initBoard", { boardState, playerInfo: players[key] });
        }
        if (i == 1) {
          players[key].role = "Player_2";
          io.to(players[key].id).emit("initBoard", { boardState, playerInfo: players[key] });
        }
        if (players.hasOwnProperty(key)) {
          console.log(`Key: ${key} PlayerID: ${players[key].id} PlayerRole: ${players[key].role} i: ${i}`);
        }
        i++;
      }
    } else {
      delete players[socket.id];
    }
  });
});

// 启动服务
server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

// 获取随机颜色
// function getRandomColor() {
//   const colors = ["red", "blue"];
//   // return colors[Math.floor(Math.random() * colors.length)];
//   return "blue";
// }
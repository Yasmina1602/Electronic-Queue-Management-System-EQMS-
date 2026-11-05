let ioInstance = null;

export function initSocketIO(server, io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    // Client can join a specific branch room: e.g. "branch:branch-1"
    socket.on('join:branch', (branchId) => {
      if (branchId) {
        socket.join(`branch:${branchId}`);
      }
    });

    socket.on('leave:branch', (branchId) => {
      if (branchId) {
        socket.leave(`branch:${branchId}`);
      }
    });
  });

  return io;
}

export function getIO() {
  return ioInstance;
}

/**
 * Emit event to branch room and global room
 */
export function emitBranchEvent(branchId, event, data) {
  if (!ioInstance) return;
  if (branchId) {
    ioInstance.to(`branch:${branchId}`).emit(event, data);
  }
  // Also emit globally for superadmin/monitoring dashboards
  ioInstance.emit(`global:${event}`, { branchId, ...data });
}


export const callService = {
  initiateCall: async (userId: string, recipientId: string) => {
    return {
      callId: `call_${Date.now()}`,
      initiator: userId,
      recipient: recipientId,
      startedAt: new Date()
    };
  },

  answerCall: (callId: string) => {
    return {
      callId,
      answeredAt: new Date()
    };
  },

  rejectCall: (callId: string) => {
    return {
      callId,
      rejectedAt: new Date()
    };
  },

  endCall: (callId: string) => {
    return {
      callId,
      endedAt: new Date()
    };
  }
};

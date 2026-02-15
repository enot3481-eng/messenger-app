export const searchService = {
  searchUserByTag: (tag: string, users: any[]) => {
    return users.filter(u => u.tag.toLowerCase().includes(tag.toLowerCase()));
  },

  searchUsersByNickname: (nickname: string, users: any[]) => {
    return users.filter(u => u.nickname.toLowerCase().includes(nickname.toLowerCase()));
  },

  searchMessagesInChat: (query: string, messages: any[]) => {
    return messages.filter(m => m.content.toLowerCase().includes(query.toLowerCase()));
  },

  fuzzySearchMessages: (query: string, messages: any[]) => {
    return messages.filter(m => {
      const queryLower = query.toLowerCase();
      const contentLower = m.content.toLowerCase();
      
      let queryIndex = 0;
      for (let i = 0; i < contentLower.length && queryIndex < queryLower.length; i++) {
        if (contentLower[i] === queryLower[queryIndex]) {
          queryIndex++;
        }
      }
      
      return queryIndex === queryLower.length;
    });
  }
};

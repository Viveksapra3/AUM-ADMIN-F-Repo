import { useChat } from "@/hooks/useChat";

export const LastChat = () => {
  const { messages, message, loading } = useChat();

  // Get the most recent message
  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  if (loading) {
    return (
      <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-white/10">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-white/80 text-sm">Loading...</span>
        </div>
      </div>
    );
  }

  if (!lastMessage) {
    return (
      <div className="p-4 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-lg border border-white/10">
        <p className="text-white/60 text-sm italic">No recent messages</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-lg border border-white/10 shadow-lg">
      <div className="flex items-start justify-between mb-2">
        <h3 className="text-white font-semibold text-sm uppercase tracking-wide">
          Latest Message
        </h3>
        <span className="text-white/50 text-xs">
          {new Date().toLocaleTimeString()}
        </span>
      </div>
      
      <div className="space-y-2">
        {/* Display message text */}
        {lastMessage.text && (
          <p className="text-white text-base leading-relaxed">
            {lastMessage.text}
          </p>
        )}
        
        {/* Display message content if it's an object */}
        {lastMessage.content && (
          <p className="text-white text-base leading-relaxed">
            {lastMessage.content}
          </p>
        )}
        
        {/* Display audio status if available */}
        {lastMessage.audio && (
          <div className="flex items-center space-x-2 mt-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-green-400 text-xs">Audio available</span>
          </div>
        )}
        
        {/* Display message type/role if available */}
        {lastMessage.role && (
          <span className="inline-block px-2 py-1 bg-white/10 rounded-full text-white/70 text-xs">
            {lastMessage.role}
          </span>
        )}
      </div>
    </div>
  );
};

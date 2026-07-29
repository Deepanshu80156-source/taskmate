import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Send, User } from 'lucide-react';

export default function StudentMessages() {
  const { currentUser, conversations, sendMessage } = useAuth();
  
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // For students, their teacher is their only contact point in this prototype
  const teacherId = currentUser?.teacherId || 't1'; 
  
  const activeConv = conversations.find(c => c.studentId === currentUser?.id);
  const messages = activeConv?.messages || [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser) return;
    await sendMessage(currentUser.id, currentUser.id, newMessage.trim());
    setNewMessage('');
  };

  return (
    <div className="h-[calc(100vh-8rem)] md:h-[calc(100vh-6rem)] flex flex-col space-y-4">
      <header className="flex items-center gap-3 shrink-0">
        <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Messages</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">Chat with your Teacher</p>
        </div>
      </header>

      <div className="flex-1 glass-card rounded-2xl border border-border flex flex-col overflow-hidden shadow-sm max-w-4xl mx-auto w-full">
        {/* Chat Header */}
        <div className="p-4 border-b border-border bg-background/50 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Teacher</h3>
            <p className="text-xs text-muted-foreground">Direct Message</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <MessageCircle className="w-12 h-12 mb-3 opacity-20" />
              <p>No messages yet. Send a message to start the conversation.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.senderId === currentUser?.id;
              return (
                <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div 
                    className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2 ${
                      isMine 
                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                        : 'bg-card border border-border text-card-foreground rounded-bl-sm shadow-sm'
                    }`}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      {msg.timestamp}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background/50 border-t border-border">
          <form onSubmit={handleSend} className="flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message here..."
              className="flex-1 bg-background border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4 ml-[-2px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

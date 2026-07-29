import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { MessageCircle, Send, Search } from 'lucide-react';

export default function TeacherMessages() {
  const { currentUser, getStudentsForTeacher, conversations, sendMessage } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeStudentId, setActiveStudentId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const teacherStudents = currentUser ? getStudentsForTeacher(currentUser.id) : [];

  const filteredStudents = teacherStudents.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeConversation = conversations.find(c => c.studentId === activeStudentId) || {
    studentId: activeStudentId || '',
    messages: []
  };

  const activeStudent = teacherStudents.find(s => s.id === activeStudentId);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (activeStudentId) {
      scrollToBottom();
    }
  }, [activeConversation.messages, activeStudentId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeStudentId || !currentUser) return;
    await sendMessage(activeStudentId, currentUser.id, newMessage.trim());
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
          <p className="text-muted-foreground text-sm md:text-base mt-1">Communicate directly with students</p>
        </div>
      </header>

      <div className="flex-1 glass-card rounded-2xl border border-border flex overflow-hidden shadow-sm">
        
        {/* Left Sidebar - Student List */}
        <div className={`w-full md:w-80 border-r border-border flex flex-col bg-background/30 ${activeStudentId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-border">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-input rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {filteredStudents.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground text-sm">No students found.</div>
            ) : (
              filteredStudents.map(student => {
                const hasConv = conversations.some(c => c.studentId === student.id && c.messages.length > 0);
                const isActive = activeStudentId === student.id;
                
                return (
                  <div
                    key={student.id}
                    onClick={() => setActiveStudentId(student.id)}
                    className={`p-4 border-b border-border/50 cursor-pointer transition-colors flex items-center gap-3 ${
                      isActive ? 'bg-primary/10 border-l-4 border-l-primary' : 'hover:bg-secondary/50 border-l-4 border-l-transparent'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                      {student.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate text-sm">{student.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{student.class}</p>
                    </div>
                    {hasConv && !isActive && (
                      <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Area - Chat Area */}
        <div className={`flex-1 flex flex-col bg-background/50 ${!activeStudentId ? 'hidden md:flex' : 'flex'}`}>
          {!activeStudentId ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-3">
              <span className="text-5xl">💬</span>
              <p className="text-lg font-semibold text-foreground">Select a Student</p>
              <p className="text-sm text-muted-foreground">Choose a student from the list to view or start a conversation.</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-border flex items-center gap-3 bg-background">
                <button 
                  className="md:hidden p-2 -ml-2 rounded-lg hover:bg-secondary text-secondary-foreground"
                  onClick={() => setActiveStudentId(null)}
                >
                  ← Back
                </button>
                <div className="w-10 h-10 rounded-full bg-secondary text-secondary-foreground flex items-center justify-center font-bold">
                  {activeStudent?.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{activeStudent?.name}</h3>
                  <p className="text-xs text-muted-foreground">{activeStudent?.class} • Roll: {activeStudent?.rollNumber}</p>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                {activeConversation.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <p>No messages yet. Send a message to start the conversation with {activeStudent?.name}.</p>
                  </div>
                ) : (
                  activeConversation.messages.map((msg) => {
                    const isMine = msg.senderId === currentUser?.id;
                    return (
                      <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                        <div 
                          className={`max-w-[75%] rounded-2xl px-4 py-2 ${
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
              <div className="p-4 bg-background border-t border-border">
                <form onSubmit={handleSend} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={`Message ${activeStudent?.name.split(' ')[0]}...`}
                    className="flex-1 bg-muted/50 border border-input rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}

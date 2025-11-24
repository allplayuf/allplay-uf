import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Trophy, Image as ImageIcon, BarChart } from "lucide-react";
import { base44 } from "@/api/base44Client";

export default function TeamChat({ team, currentUser, isMember }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadMessages();
    // Poll for new messages every 3 seconds
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [team.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadMessages = async () => {
    try {
      const msgs = await base44.entities.TeamMessage.filter({ team_id: team.id }, '-created_date', 50);
      
      // Load user data for each message
      const msgsWithUsers = await Promise.all(
        msgs.map(async (msg) => {
          const userData = await base44.entities.User.get(msg.user_id);
          return { ...msg, user: userData };
        })
      );
      
      setMessages(msgsWithUsers.reverse());
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await base44.entities.TeamMessage.create({
        team_id: team.id,
        user_id: currentUser.id,
        message_type: 'text',
        content: newMessage.trim()
      });

      setNewMessage('');
      loadMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Kunde inte skicka meddelande. Försök igen.');
    }
  };

  const getMessageIcon = (type) => {
    switch (type) {
      case 'match_created': return <Trophy className="w-4 h-4" />;
      case 'highlight_added': return <ImageIcon className="w-4 h-4" />;
      case 'poll_created': return <BarChart className="w-4 h-4" />;
      default: return null;
    }
  };

  if (!isMember) {
    return (
      <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
        <CardContent className="p-12 text-center">
          <p className="text-[#B6C2BC]">Endast lagmedlemmar kan se chatten</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#121715] border border-[#223029] shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
      <CardHeader className="border-b border-[#223029]">
        <CardTitle className="text-[#F4F7F5] text-[18px] leading-[24px]">Lagchatt</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Messages */}
        <div className="h-[400px] overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-4 border-[#2BA84A] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-[#B6C2BC] text-sm">
              Inga meddelanden än. Säg hej! 👋
            </div>
          ) : (
            messages.map((msg) => {
              const isSystem = msg.message_type !== 'text';
              const isOwnMessage = msg.user_id === currentUser.id;

              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} ${isSystem ? 'justify-center' : ''}`}
                >
                  {isSystem ? (
                    <div className="flex items-center gap-2 bg-[#18221E] rounded-lg px-4 py-2 max-w-[80%]">
                      {getMessageIcon(msg.message_type)}
                      <span className="text-[13px] leading-[18px] text-[#B6C2BC]">{msg.content}</span>
                    </div>
                  ) : (
                    <div className={`max-w-[70%] ${isOwnMessage ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isOwnMessage && (
                        <span className="text-[11px] leading-[16px] text-[#7B8A83] px-3">{msg.user?.full_name}</span>
                      )}
                      <div
                        className={`rounded-2xl px-4 py-2 ${
                          isOwnMessage
                            ? 'bg-[#2BA84A] text-[#FFFFFF]'
                            : 'bg-[#18221E] text-[#F4F7F5]'
                        }`}
                      >
                        <p className="text-[14px] leading-[20px] break-words">{msg.content}</p>
                      </div>
                      <span className="text-[11px] leading-[16px] text-[#7B8A83] px-3">
                        {new Date(msg.created_date).toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSendMessage} className="p-4 border-t border-[#223029]">
          <div className="flex gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Skriv ett meddelande..."
              className="flex-1 bg-[#18221E] border border-[#223029] text-[#F4F7F5] placeholder:text-[#7B8A83]"
              maxLength={500}
            />
            <Button
              type="submit"
              disabled={!newMessage.trim()}
              className="bg-[#2BA84A] hover:bg-[#248232] text-[#FFFFFF] disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
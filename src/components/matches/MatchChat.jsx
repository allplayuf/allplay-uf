
import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageCircle, Send, Clock, User } from "lucide-react";
import { ChatMessage } from "@/entities/ChatMessage";
import { useT } from "@/i18n/LanguageProvider";

export default function MatchChat({ matchId, currentUser, onClose }) {
  const { t } = useT();
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const standardPhrases = [
    t('chat.phrase_1'),
    t('chat.phrase_2'),
    t('chat.phrase_3'),
    t('chat.phrase_4'),
    t('chat.phrase_5'),
    t('chat.phrase_6'),
    t('chat.phrase_7'),
  ];

  const loadMessages = useCallback(async () => {
    try {
      const chatMessages = await ChatMessage.filter({ match_id: matchId });
      setMessages(chatMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [matchId]); // `matchId` is a dependency for `loadMessages`

  useEffect(() => {
    loadMessages();
  }, [loadMessages]); // `loadMessages` is a dependency for `useEffect`

  const sendMessage = async (content) => {
    try {
      await ChatMessage.create({
        match_id: matchId,
        user_id: currentUser.id,
        content: content,
        timestamp: new Date().toISOString()
      });
      loadMessages(); // Re-fetch messages after sending
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('sv-SE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (isLoading) {
    return (
      <Card className="shadow-allplay border-0 bg-white/90 backdrop-blur-sm">
        <CardContent className="p-6 text-center">
          <div className="w-8 h-8 border-4 border-primary-green border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('chat.loading')}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-allplay border-0 bg-white/90 backdrop-blur-sm">
      <CardHeader className="border-b border-gray-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary-green" />
            {t('chat.title')}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Messages Area */}
        <div className="h-64 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p>{t('chat.empty')}</p>
              <p className="text-sm">{t('chat.empty_sub')}</p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.user_id === currentUser.id 
                    ? 'flex-row-reverse' 
                    : 'flex-row'
                }`}
              >
                <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    message.user_id === currentUser.id
                      ? 'bg-primary-green text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <p className="text-sm">{message.content}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3 opacity-70" />
                    <span className="text-xs opacity-70">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Standard Phrases */}
        <div className="border-t border-gray-200 p-4">
          <div className="mb-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">{t('chat.quick_label')}</h4>
            <div className="grid grid-cols-1 gap-2">
              {standardPhrases.map((phrase) => (
                <Button
                  key={phrase}
                  variant="outline"
                  size="sm"
                  onClick={() => sendMessage(phrase)}
                  className="text-left justify-start hover:bg-green-50 hover:border-primary-green hover:text-primary-green"
                >
                  <Send className="w-3 h-3 mr-2" />
                  {phrase}
                </Button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-xs text-blue-800">
              <strong>{t('chat.safety_label')}</strong> {t('chat.safety_text')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

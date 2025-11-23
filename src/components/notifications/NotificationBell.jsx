import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const user = await base44.auth.me();
      if (!user) return [];
      // Fetch unread and recent read notifications
      return await base44.entities.Notification.filter({ user_id: user.id }, '-created_at', 20);
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      try {
        await base44.entities.Notification.update(notification.id, { is_read: true });
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch (error) {
        console.error("Failed to mark as read", error);
      }
    }
    
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;

    // In a real app, we'd have a batch update endpoint
    // For now, just optimistic update locally + one by one (or backend function)
    // To keep it simple and fast UI:
    try {
       // We can create a backend function for this if needed, but loop is okay for small numbers
       await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
       queryClient.invalidateQueries({ queryKey: ['notifications'] });
    } catch (e) {
       console.error(e);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-[#223029]">
          <Bell className="w-5 h-5 text-[#B6C2BC]" />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#F4743B] rounded-full border-2 border-[#121715]" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-[#121715] border-[#223029] text-[#F4F7F5]" align="end">
        <div className="flex items-center justify-between p-4 border-b border-[#223029]">
          <h4 className="font-semibold">Aviseringar</h4>
          {unreadCount > 0 && (
            <button 
              onClick={markAllAsRead}
              className="text-xs text-[#2BA84A] hover:underline"
            >
              Markera alla som lästa
            </button>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {isLoading ? (
            <div className="p-4 text-center text-[#7B8A83] text-sm">Laddar...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-[#7B8A83] text-sm">
              Inga nya aviseringar
            </div>
          ) : (
            <div className="divide-y divide-[#223029]">
              {notifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`w-full text-left p-4 hover:bg-[#18221E] transition-colors ${
                    !notification.is_read ? 'bg-[#2BA84A]/5' : ''
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                      !notification.is_read ? 'bg-[#2BA84A]' : 'bg-transparent'
                    }`} />
                    <div>
                      <p className={`text-sm ${!notification.is_read ? 'font-semibold text-[#F4F7F5]' : 'text-[#B6C2BC]'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-[#7B8A83] mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-[#7B8A83] mt-2">
                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true, locale: sv })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
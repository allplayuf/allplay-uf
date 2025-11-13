import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, MessageCircle, Pin, User } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const CATEGORY_COLORS = {
  'App': 'bg-[#4169E1]/20 text-[#B0C4DE]',
  'Matcher': 'bg-[#2BA84A]/20 text-[#CFE8D6]',
  'Karta': 'bg-[#9370DB]/20 text-[#DDD6FE]',
  'Lag': 'bg-[#F4743B]/20 text-[#FDE3D2]',
  'Profil': 'bg-[#14B8A6]/20 text-[#99F6E4]',
  'Annat': 'bg-[#7B8A83]/20 text-[#B6C2BC]'
};

const STATUS_COLORS = {
  'Öppen': 'bg-[#7B8A83]/20 text-[#B6C2BC]',
  'Undersöks': 'bg-[#4169E1]/20 text-[#B0C4DE]',
  'Planerad': 'bg-[#9370DB]/20 text-[#DDD6FE]',
  'Under utveckling': 'bg-[#F4743B]/20 text-[#FDE3D2]',
  'Lanserad': 'bg-[#2BA84A]/20 text-[#CFE8D6]',
  'Ej planerad': 'bg-[#DC2626]/20 text-[#FCA5A5]'
};

export default function FeedbackPostCard({ post, user, onVote, index }) {
  const isAuthor = post.author_id === user?.id;
  const hasVoted = post.hasVoted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
    >
      <Card className="bg-[#121715] border border-[#223029] hover:border-[#2BA84A]/30 transition-all shadow-[0_6px_18px_rgba(0,0,0,0.22)] rounded-[16px]">
        <CardContent className="p-4 sm:p-6">
          <div className="flex gap-4">
            {/* Vote Section */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <motion.button
                onClick={() => onVote(post.id)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  hasVoted
                    ? 'bg-[#4169E1] text-white ring-2 ring-[#4169E1]/30'
                    : 'bg-[#18221E] text-[#B6C2BC] hover:bg-[#4169E1]/20 hover:text-[#4169E1]'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${hasVoted ? 'fill-white' : ''}`} />
              </motion.button>
              <span className={`text-sm font-bold ${hasVoted ? 'text-[#4169E1]' : 'text-[#B6C2BC]'}`}>
                {post.upvotes_count}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-2">
                    {post.is_pinned && (
                      <Pin className="w-4 h-4 text-[#F4743B]" />
                    )}
                    <Badge className={CATEGORY_COLORS[post.category] || CATEGORY_COLORS['Annat']}>
                      {post.category}
                    </Badge>
                    {post.status !== 'Öppen' && (
                      <Badge className={STATUS_COLORS[post.status]}>
                        {post.status}
                      </Badge>
                    )}
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-[#F4F7F5] mb-2">
                    {post.title}
                  </h3>
                  <p className="text-sm text-[#B6C2BC] line-clamp-2 mb-3">
                    {post.body}
                  </p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-[#7B8A83]">
                  <div className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{post.author?.full_name || 'Okänd'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{post.comments_count || 0}</span>
                  </div>
                  <span>
                    {new Date(post.created_date).toLocaleDateString('sv-SE', {
                      day: 'numeric',
                      month: 'short'
                    })}
                  </span>
                </div>

                {isAuthor && (
                  <Badge className="bg-[#9370DB]/20 text-[#DDD6FE] text-xs">
                    Ditt inlägg
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
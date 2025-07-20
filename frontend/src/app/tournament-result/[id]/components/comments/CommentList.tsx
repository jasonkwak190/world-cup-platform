'use client';

import React from 'react';
import { EnhancedComment, CommentReply } from '../../hooks/useCommentSystem';
import CommentItem from './CommentItem';

export interface CommentListProps {
  comments: EnhancedComment[];
  editingComment: number | null;
  editContent: string;
  replyingTo: number | null;
  replyContent: string;
  editingReply: {commentId: number, replyId: number} | null;
  editReplyContent: string;
  openMenu: number | null;
  openReplyMenu: {commentId: number, replyId: number} | null;
  guestName: string;
  isAuthenticated: boolean;
  theme: 'minimal' | 'neon' | 'paper' | 'comic' | 'gaming';
  onLike: (commentId: number, replyId?: number) => void;
  onEdit: (commentId: number) => void;
  onSaveEdit: (commentId: number) => void;
  onDelete: (commentId: number) => void;
  onReply: (commentId: number | null) => void;
  onSubmitReply: (commentId: number) => void;
  onEditReply: (commentId: number, replyId: number) => void;
  onSaveReplyEdit: (commentId: number, replyId: number) => void;
  onDeleteReply: (commentId: number, replyId: number) => void;
  onReport: (commentId: number, replyId?: number) => void;
  onToggleMenu: (commentId: number) => void;
  onToggleReplyMenu: (commentId: number, replyId: number) => void;
  setEditContent: (content: string) => void;
  setReplyContent: (content: string) => void;
  setEditReplyContent: (content: string) => void;
  setEditingComment: (id: number | null) => void;
  setEditingReply: (reply: {commentId: number, replyId: number} | null) => void;
  setGuestName: (name: string) => void;
}

const CommentList: React.FC<CommentListProps> = ({
  comments,
  editingComment,
  editContent,
  replyingTo,
  replyContent,
  editingReply,
  editReplyContent,
  openMenu,
  openReplyMenu,
  guestName,
  isAuthenticated,
  theme,
  onLike,
  onEdit,
  onSaveEdit,
  onDelete,
  onReply,
  onSubmitReply,
  onEditReply,
  onSaveReplyEdit,
  onDeleteReply,
  onReport,
  onToggleMenu,
  onToggleReplyMenu,
  setEditContent,
  setReplyContent,
  setEditReplyContent,
  setEditingComment,
  setEditingReply,
  setGuestName
}) => {
  const getThemeClasses = () => {
    switch (theme) {
      case 'minimal':
        return {
          container: 'bg-white border-t border-gray-100 divide-y divide-gray-100 shadow-sm',
          itemContainer: 'p-6'
        };
      
      case 'neon':
        return {
          container: 'bg-black/80 backdrop-blur-sm border-x border-cyan-500/30 divide-y divide-cyan-500/30',
          itemContainer: 'p-6'
        };
      
      case 'paper':
        return {
          container: 'bg-amber-50 border-x-2 border-amber-200 divide-y-2 divide-amber-200',
          itemContainer: 'p-6'
        };
      
      case 'comic':
        return {
          container: 'bg-white border-x-4 border-black divide-y-4 divide-black',
          itemContainer: 'p-6'
        };
      
      case 'gaming':
        return {
          container: 'bg-gray-800/80 backdrop-blur-sm border-x border-purple-500/30 divide-y divide-purple-500/30',
          itemContainer: 'p-6'
        };
      
      default:
        return getThemeClasses.call(this);
    }
  };

  const themeClasses = getThemeClasses();

  if (comments.length === 0) {
    return (
      <div className={`${themeClasses.container} ${themeClasses.itemContainer}`}>
        <div className="text-center py-8">
          <p className={`${
            theme === 'neon' ? 'text-cyan-300' : 
            theme === 'paper' ? 'text-amber-700' :
            theme === 'comic' ? 'text-black' :
            theme === 'gaming' ? 'text-gray-300' :
            'text-gray-500'
          }`}>
            아직 댓글이 없습니다. 첫 번째 댓글을 작성해보세요!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses.container}>
      {comments.map((comment) => (
        <div key={comment.id} className={themeClasses.itemContainer}>
          <CommentItem
            comment={comment}
            isEditing={editingComment === comment.id}
            editContent={editContent}
            isReplying={replyingTo === comment.id}
            replyContent={replyContent}
            editingReply={editingReply}
            editReplyContent={editReplyContent}
            openMenu={openMenu === comment.id}
            openReplyMenu={openReplyMenu}
            guestName={guestName}
            isAuthenticated={isAuthenticated}
            theme={theme}
            onLike={onLike}
            onEdit={onEdit}
            onSaveEdit={onSaveEdit}
            onDelete={onDelete}
            onReply={onReply}
            onSubmitReply={onSubmitReply}
            onEditReply={onEditReply}
            onSaveReplyEdit={onSaveReplyEdit}
            onDeleteReply={onDeleteReply}
            onReport={onReport}
            onToggleMenu={onToggleMenu}
            onToggleReplyMenu={onToggleReplyMenu}
            setEditContent={setEditContent}
            setReplyContent={setReplyContent}
            setEditReplyContent={setEditReplyContent}
            setEditingComment={setEditingComment}
            setEditingReply={setEditingReply}
            setGuestName={setGuestName}
          />
        </div>
      ))}
    </div>
  );
};

export default CommentList;
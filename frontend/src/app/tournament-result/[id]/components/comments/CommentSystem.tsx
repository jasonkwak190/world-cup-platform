'use client';

import React from 'react';
import { EnhancedComment, useCommentSystem, CurrentUser } from '../../hooks/useCommentSystem';
import CommentForm from './CommentForm';
import CommentList from './CommentList';
import CommentFilter from './CommentFilter';
import CommentPagination from './CommentPagination';

export interface CommentSystemProps {
  initialComments?: any[];
  isAuthenticated?: boolean;
  currentUser?: CurrentUser;
  worldcupCreatorId?: string;
  worldcupId?: string;
  theme: 'minimal' | 'neon' | 'paper' | 'comic' | 'gaming';
  className?: string;
}

const CommentSystem: React.FC<CommentSystemProps> = ({
  initialComments,
  isAuthenticated = false,
  currentUser,
  worldcupCreatorId,
  worldcupId,
  theme,
  className = ''
}) => {
  const commentSystem = useCommentSystem({
    initialComments,
    isAuthenticated,
    currentUser,
    worldcupCreatorId,
    worldcupId
  });

  const {
    comments,
    allComments,
    newComment,
    guestName,
    editingComment,
    editContent,
    replyingTo,
    replyContent,
    editingReply,
    editReplyContent,
    currentPage,
    totalPages,
    sortOption,
    openMenu,
    openReplyMenu,
    setNewComment,
    setGuestName,
    setEditContent,
    setReplyContent,
    setEditReplyContent,
    setSortOption,
    setReplyingTo,
    setEditingComment,
    setEditingReply,
    handleLike,
    handleSubmitComment,
    handleEditComment,
    handleSaveEdit,
    handleDeleteComment,
    handleSubmitReply,
    handleEditReply,
    handleSaveReplyEdit,
    handleDeleteReply,
    handleReport,
    toggleMenu,
    toggleReplyMenu,
    paginate
  } = commentSystem;

  return (
    <div className={`comment-system ${className}`}>
      {/* Header with filter and count */}
      <div className="comment-header mb-6">
        <div className="text-center mb-4">
          <div className="flex justify-center mb-6">
            <CommentFilter
              sortOption={sortOption}
              setSortOption={setSortOption}
              theme={theme}
            />
          </div>
          <h3 className="comment-title">
            댓글 ({allComments.length})
          </h3>
        </div>
      </div>

      {/* Comment Form */}
      <CommentForm
        newComment={newComment}
        guestName={guestName}
        isAuthenticated={isAuthenticated}
        theme={theme}
        onCommentChange={setNewComment}
        onGuestNameChange={setGuestName}
        onSubmit={handleSubmitComment}
      />

      {/* Comment List */}
      <CommentList
        comments={comments}
        editingComment={editingComment}
        editContent={editContent}
        replyingTo={replyingTo}
        replyContent={replyContent}
        editingReply={editingReply}
        editReplyContent={editReplyContent}
        openMenu={openMenu}
        openReplyMenu={openReplyMenu}
        guestName={guestName}
        isAuthenticated={isAuthenticated}
        theme={theme}
        onLike={handleLike}
        onEdit={handleEditComment}
        onSaveEdit={handleSaveEdit}
        onDelete={handleDeleteComment}
        onReply={setReplyingTo}
        onSubmitReply={handleSubmitReply}
        onEditReply={handleEditReply}
        onSaveReplyEdit={handleSaveReplyEdit}
        onDeleteReply={handleDeleteReply}
        onReport={handleReport}
        onToggleMenu={toggleMenu}
        onToggleReplyMenu={toggleReplyMenu}
        setEditContent={setEditContent}
        setReplyContent={setReplyContent}
        setEditReplyContent={setEditReplyContent}
        setEditingComment={setEditingComment}
        setEditingReply={setEditingReply}
        setGuestName={setGuestName}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <CommentPagination
          currentPage={currentPage}
          totalPages={totalPages}
          theme={theme}
          onPageChange={paginate}
        />
      )}
    </div>
  );
};

export default CommentSystem;
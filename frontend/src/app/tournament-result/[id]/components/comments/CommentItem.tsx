'use client';

import React from 'react';
import { Heart, Edit3, Trash2, Reply, MoreHorizontal, User, Shield, Zap, Star } from 'lucide-react';
import { EnhancedComment } from '../../hooks/useCommentSystem';

export interface CommentItemProps {
  comment: EnhancedComment;
  isEditing: boolean;
  editContent: string;
  isReplying: boolean;
  replyContent: string;
  editingReply: {commentId: number, replyId: number} | null;
  editReplyContent: string;
  openMenu: boolean;
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

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  isEditing,
  editContent,
  isReplying,
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
  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'VIP':
        return <Star className="w-4 h-4 text-yellow-400 fill-current" />;
      case 'Gold':
        return <Star className="w-4 h-4 text-yellow-600 fill-current" />;
      case 'Silver':
        return <Star className="w-4 h-4 text-gray-400 fill-current" />;
      default:
        return <Star className="w-4 h-4 text-gray-600 fill-current" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'VIP': return 'from-purple-500 to-pink-500';
      case 'Gold': return 'from-yellow-500 to-amber-500';
      case 'Silver': return 'from-gray-400 to-gray-500';
      case 'Bronze': return 'from-amber-700 to-yellow-800';
      default: return 'from-blue-500 to-cyan-500';
    }
  };

  const getThemeClasses = () => {
    switch (theme) {
      case 'minimal':
        return {
          avatar: 'w-10 h-10 rounded-full object-cover',
          userName: 'font-medium text-gray-900',
          userBadge: 'text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full',
          creatorBadge: 'px-2 py-1 bg-yellow-400 text-yellow-900 text-xs rounded-full font-medium',
          timestamp: 'text-sm text-gray-600',
          menuButton: 'p-1 text-gray-400 hover:text-gray-600 transition-colors',
          menuDropdown: 'absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 z-10 overflow-hidden',
          menuItem: 'w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors',
          menuItemDanger: 'w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 transition-colors',
          content: 'text-gray-700 mb-3 leading-relaxed',
          contentBg: 'p-4 rounded-lg bg-gray-50 border border-gray-200',
          editTextarea: 'w-full p-3 border border-gray-200 rounded-lg resize-none focus:ring-2 focus:ring-gray-200 focus:border-transparent text-gray-700',
          saveButton: 'px-4 py-1 bg-gray-900 text-white rounded-full font-light text-sm',
          cancelButton: 'px-4 py-1 bg-gray-200 text-gray-700 rounded-full font-light text-sm',
          likeButton: (isLiked: boolean) => `flex items-center gap-1 text-sm transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`,
          replyButton: 'flex items-center gap-1 text-sm text-gray-500 hover:text-blue-500 transition-colors',
          replyForm: 'mt-4 ml-6 pl-4 border-l-2 border-gray-100',
          replyList: 'mt-4 ml-6 pl-4 border-l-2 border-gray-100 space-y-4'
        };
      
      case 'neon':
        return {
          avatar: 'w-full h-full rounded-full object-cover',
          userName: 'font-bold text-lg text-cyan-100',
          userBadge: 'text-xs bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30',
          creatorBadge: 'px-2 py-1 bg-yellow-400 text-black text-xs rounded-full font-bold',
          timestamp: 'text-sm text-cyan-400',
          menuButton: 'p-1 text-cyan-400 hover:text-cyan-300 transition-colors',
          menuDropdown: 'absolute right-0 mt-1 w-40 bg-gray-900 rounded-lg shadow-lg border border-cyan-500/30 z-10 overflow-hidden',
          menuItem: 'w-full text-left px-4 py-2 text-sm text-cyan-300 hover:bg-gray-800 transition-colors',
          menuItemDanger: 'w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-800 transition-colors',
          content: 'text-lg leading-relaxed text-cyan-100',
          contentBg: 'bg-gray-900/50 p-4 rounded-xl border border-cyan-500/30 mb-3',
          editTextarea: 'w-full p-3 bg-gray-900 border border-cyan-500/30 rounded-xl resize-none focus:ring-2 focus:ring-cyan-500 text-cyan-100',
          saveButton: 'px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-black rounded-xl font-bold',
          cancelButton: 'px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-xl font-bold',
          likeButton: (isLiked: boolean) => `flex items-center gap-1 px-3 py-1 rounded-full font-bold transition-colors ${
            isLiked ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
          }`,
          replyButton: 'flex items-center gap-1 px-3 py-1 rounded-full bg-gray-700 text-gray-300 hover:text-blue-400 font-bold transition-colors',
          replyForm: 'mt-4 ml-6 border-l-2 border-cyan-500 pl-4',
          replyList: 'mt-4 ml-6 border-l-2 border-cyan-500 pl-4 space-y-4'
        };
      
      case 'paper':
        return {
          avatar: 'w-full h-full rounded-full object-cover',
          userName: 'font-bold text-lg text-amber-900',
          userBadge: 'text-xs bg-amber-200 text-amber-800 px-2 py-0.5 rounded border border-amber-400',
          creatorBadge: 'px-2 py-1 bg-yellow-400 text-amber-900 text-xs rounded font-bold border border-amber-600',
          timestamp: 'text-sm text-amber-700',
          menuButton: 'p-1 text-amber-600 hover:text-amber-800 transition-colors',
          menuDropdown: 'absolute right-0 mt-1 w-40 bg-amber-50 rounded shadow-lg border-2 border-amber-300 z-10 overflow-hidden',
          menuItem: 'w-full text-left px-4 py-2 text-sm text-amber-800 hover:bg-amber-100 transition-colors',
          menuItemDanger: 'w-full text-left px-4 py-2 text-sm text-red-700 hover:bg-amber-100 transition-colors',
          content: 'text-lg leading-relaxed text-amber-900',
          contentBg: 'bg-amber-25 p-4 rounded border-2 border-amber-300 mb-3',
          editTextarea: 'w-full p-3 bg-amber-25 border-2 border-amber-300 rounded resize-none focus:ring-2 focus:ring-amber-400 text-amber-900',
          saveButton: 'px-4 py-2 bg-amber-600 text-amber-50 rounded font-bold border-2 border-amber-700',
          cancelButton: 'px-4 py-2 bg-amber-200 text-amber-800 rounded font-bold border-2 border-amber-400',
          likeButton: (isLiked: boolean) => `flex items-center gap-1 px-3 py-1 rounded font-bold transition-colors border-2 ${
            isLiked ? 'bg-red-500 text-white border-red-700' : 'bg-amber-100 text-amber-800 border-amber-400 hover:bg-amber-200'
          }`,
          replyButton: 'flex items-center gap-1 px-3 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 font-bold transition-colors border-2 border-amber-400',
          replyForm: 'mt-4 ml-6 border-l-4 border-amber-400 pl-4',
          replyList: 'mt-4 ml-6 border-l-4 border-amber-400 pl-4 space-y-4'
        };
      
      case 'comic':
        return {
          avatar: 'w-full h-full rounded-full object-cover',
          userName: 'font-bold text-lg text-black',
          userBadge: 'text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded border-2 border-blue-500',
          creatorBadge: 'px-2 py-1 bg-yellow-400 text-black text-xs rounded font-bold border-2 border-black',
          timestamp: 'text-sm text-gray-700',
          menuButton: 'p-1 text-gray-600 hover:text-black transition-colors',
          menuDropdown: 'absolute right-0 mt-1 w-40 bg-white rounded shadow-lg border-3 border-black z-10 overflow-hidden',
          menuItem: 'w-full text-left px-4 py-2 text-sm text-black hover:bg-yellow-200 transition-colors border-b-2 border-black last:border-b-0',
          menuItemDanger: 'w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-100 transition-colors border-b-2 border-black last:border-b-0',
          content: 'text-lg leading-relaxed text-black',
          contentBg: 'bg-white p-4 rounded border-3 border-black mb-3 shadow-[2px_2px_0px_0px_black]',
          editTextarea: 'w-full p-3 bg-white border-3 border-black rounded resize-none focus:ring-0 focus:border-blue-500 text-black',
          saveButton: 'px-4 py-2 bg-green-500 text-white rounded font-bold border-3 border-black shadow-[2px_2px_0px_0px_black]',
          cancelButton: 'px-4 py-2 bg-gray-300 text-black rounded font-bold border-3 border-black shadow-[2px_2px_0px_0px_black]',
          likeButton: (isLiked: boolean) => `flex items-center gap-1 px-3 py-1 rounded font-bold transition-colors border-3 border-black shadow-[2px_2px_0px_0px_black] ${
            isLiked ? 'bg-red-500 text-white' : 'bg-white text-black hover:bg-yellow-200'
          }`,
          replyButton: 'flex items-center gap-1 px-3 py-1 rounded bg-white text-black hover:bg-blue-200 font-bold transition-colors border-3 border-black shadow-[2px_2px_0px_0px_black]',
          replyForm: 'mt-4 ml-6 border-l-4 border-black pl-4',
          replyList: 'mt-4 ml-6 border-l-4 border-black pl-4 space-y-4'
        };
      
      case 'gaming':
        return {
          avatar: 'w-full h-full rounded-full object-cover',
          userName: 'font-bold text-lg text-white',
          userBadge: (level: string) => `text-xs px-2 py-1 rounded-full font-bold bg-gradient-to-r ${getLevelColor(level)} text-white`,
          creatorBadge: 'px-2 py-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-xs rounded-full font-bold',
          timestamp: 'text-sm text-gray-400',
          menuButton: 'p-1 text-gray-400 hover:text-gray-200 transition-colors',
          menuDropdown: 'absolute right-0 mt-1 w-40 bg-gray-800 rounded-lg shadow-lg border border-purple-500/30 z-10 overflow-hidden',
          menuItem: 'w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors',
          menuItemDanger: 'w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700 transition-colors',
          content: 'text-lg leading-relaxed text-gray-100',
          contentBg: 'bg-gray-700/50 p-4 rounded-xl border border-purple-500/30 mb-3',
          editTextarea: 'w-full p-3 bg-gray-700 border border-purple-500/30 rounded-xl resize-none focus:ring-2 focus:ring-purple-500 text-white',
          saveButton: 'px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold',
          cancelButton: 'px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-bold',
          likeButton: (isLiked: boolean) => `flex items-center gap-1 px-3 py-1 rounded-full font-bold transition-colors ${
            isLiked ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white' : 'bg-gray-700 text-gray-300 hover:text-white'
          }`,
          replyButton: 'flex items-center gap-1 px-3 py-1 rounded-full bg-gray-700 text-gray-300 hover:text-blue-400 font-bold transition-colors',
          replyForm: 'mt-4 ml-6 border-l-2 border-blue-500 pl-4',
          replyList: 'mt-4 ml-6 border-l-2 border-blue-500 pl-4 space-y-4'
        };
      
      default:
        return getThemeClasses.call(this);
    }
  };

  const themeClasses = getThemeClasses();

  const renderAvatar = () => {
    if (theme === 'gaming') {
      return (
        <div className="relative">
          <div className={`w-14 h-14 rounded-full p-0.5 bg-gradient-to-r ${getLevelColor(comment.author.level)}`}>
            <img
              src={comment.author.avatar}
              alt={comment.author.name}
              className={themeClasses.avatar}
            />
          </div>
          {comment.author.isVerified && (
            <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full w-6 h-6 flex items-center justify-center">
              <Shield className="w-3 h-3 text-black" />
            </div>
          )}
        </div>
      );
    }

    if (theme === 'paper') {
      return (
        <div className="w-12 h-12 bg-amber-200 rounded-full p-0.5 border-2 border-amber-300">
          <img
            src={comment.author.avatar}
            alt={comment.author.name}
            className={themeClasses.avatar}
          />
        </div>
      );
    }

    if (theme === 'comic') {
      return (
        <div className="w-12 h-12 bg-yellow-400 rounded-full p-0.5 border-3 border-black">
          <img
            src={comment.author.avatar}
            alt={comment.author.name}
            className={themeClasses.avatar}
          />
        </div>
      );
    }

    return (
      <img
        src={comment.author.avatar}
        alt={comment.author.name}
        className={themeClasses.avatar}
      />
    );
  };

  const renderUserBadge = () => {
    if (theme === 'gaming') {
      return (
        <span className={themeClasses.userBadge(comment.author.level)}>
          {comment.author.level}
        </span>
      );
    }

    if (comment.author.isVerified) {
      return (
        <span className={themeClasses.userBadge}>
          인증됨
        </span>
      );
    }

    if (theme === 'minimal') {
      return getLevelBadge(comment.author.level);
    }

    return null;
  };

  return (
    <div className="flex gap-4">
      {renderAvatar()}
      
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={themeClasses.userName}>
              {comment.author.name}
            </span>
            {renderUserBadge()}
            {comment.isCreator && (
              <span className={themeClasses.creatorBadge}>
                제작자
              </span>
            )}
            <span className={themeClasses.timestamp}>
              {comment.timestamp}
            </span>
          </div>
          
          {/* More menu */}
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onToggleMenu(comment.id);
              }}
              className={themeClasses.menuButton}
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            
            {openMenu && (
              <div className={themeClasses.menuDropdown}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReport(comment.id);
                  }}
                  className={themeClasses.menuItem}
                >
                  신고하기
                </button>
                {comment.isOwner && (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit(comment.id);
                      }}
                      className={themeClasses.menuItem}
                    >
                      수정하기
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(comment.id);
                      }}
                      className={themeClasses.menuItemDanger}
                    >
                      삭제하기
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={themeClasses.editTextarea}
              rows={3}
            />
            <div className="flex gap-2">
              <button
                onClick={() => onSaveEdit(comment.id)}
                className={themeClasses.saveButton}
              >
                저장
              </button>
              <button
                onClick={() => setEditingComment(null)}
                className={themeClasses.cancelButton}
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={themeClasses.contentBg}>
              <p className={themeClasses.content}>{comment.content}</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => onLike(comment.id)}
                className={themeClasses.likeButton(comment.isLiked)}
              >
                <Heart className={`w-4 h-4 ${comment.isLiked ? 'fill-current' : ''}`} />
                <span>{comment.likes}</span>
              </button>
              
              <button 
                onClick={() => onReply(isReplying ? null : comment.id)}
                className={themeClasses.replyButton}
              >
                <Reply className="w-4 h-4" />
                <span>답글 {comment.replies?.length || 0}</span>
              </button>
            </div>
          </>
        )}
        
        {/* Reply form */}
        {isReplying && (
          <div className={themeClasses.replyForm}>
            <div className="space-y-3">
              {!isAuthenticated && (
                <input
                  type="text"
                  placeholder="닉네임을 입력하세요..."
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className={themeClasses.editTextarea}
                />
              )}
              <textarea
                placeholder="답글을 입력하세요..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                className={themeClasses.editTextarea}
                rows={2}
              />
              <div className="flex justify-between">
                <button
                  onClick={() => onReply(null)}
                  className={themeClasses.cancelButton}
                >
                  취소
                </button>
                <button
                  onClick={() => onSubmitReply(comment.id)}
                  disabled={!replyContent.trim() || (!isAuthenticated && !guestName.trim())}
                  className={`${themeClasses.saveButton} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  답글 작성
                  {theme === 'gaming' && <Zap className="w-4 h-4 inline ml-1" />}
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className={themeClasses.replyList}>
            {comment.replies.map(reply => (
              <div key={reply.id} className={theme === 'gaming' ? 'bg-gray-700/50 p-4 rounded-xl border border-blue-500/30' : theme === 'comic' ? 'bg-yellow-50 p-4 rounded border-2 border-black' : theme === 'paper' ? 'bg-amber-25 p-4 rounded border-2 border-amber-300' : 'relative'}>
                <div className="flex gap-3">
                  {theme === 'gaming' ? (
                    <div className={`w-10 h-10 rounded-full p-0.5 bg-gradient-to-r ${getLevelColor(reply.author.level)}`}>
                      <img
                        src={reply.author.avatar}
                        alt={reply.author.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                  ) : (
                    <img
                      src={reply.author.avatar}
                      alt={reply.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className={theme === 'gaming' ? 'font-bold text-white' : theme === 'neon' ? 'font-bold text-cyan-100' : theme === 'paper' ? 'font-bold text-amber-900' : theme === 'comic' ? 'font-bold text-black' : 'font-medium text-gray-900'}>
                          {reply.author.name}
                        </span>
                        {theme === 'gaming' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold bg-gradient-to-r ${getLevelColor(reply.author.level)} text-white`}>
                            {reply.author.level}
                          </span>
                        )}
                        {reply.author.isVerified && theme !== 'gaming' && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full">
                            인증됨
                          </span>
                        )}
                        {reply.isCreator && (
                          <span className={themeClasses.creatorBadge}>
                            제작자
                          </span>
                        )}
                        <span className={theme === 'gaming' ? 'text-xs text-gray-400' : theme === 'neon' ? 'text-xs text-cyan-400' : theme === 'paper' ? 'text-xs text-amber-700' : theme === 'comic' ? 'text-xs text-gray-700' : 'text-xs text-gray-500'}>
                          {reply.timestamp}
                        </span>
                      </div>
                      
                      {/* Reply menu */}
                      <div className="relative">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleReplyMenu(comment.id, reply.id);
                          }}
                          className={themeClasses.menuButton}
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        
                        {openReplyMenu?.commentId === comment.id && openReplyMenu?.replyId === reply.id && (
                          <div className={themeClasses.menuDropdown}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onReport(comment.id, reply.id);
                              }}
                              className={themeClasses.menuItem}
                            >
                              신고하기
                            </button>
                            {reply.isOwner && (
                              <>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEditReply(comment.id, reply.id);
                                  }}
                                  className={themeClasses.menuItem}
                                >
                                  수정하기
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteReply(comment.id, reply.id);
                                  }}
                                  className={themeClasses.menuItemDanger}
                                >
                                  삭제하기
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {editingReply && editingReply.commentId === comment.id && editingReply.replyId === reply.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editReplyContent}
                          onChange={(e) => setEditReplyContent(e.target.value)}
                          className={themeClasses.editTextarea}
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => onSaveReplyEdit(comment.id, reply.id)}
                            className={theme === 'gaming' ? 'px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-bold text-sm' : 'px-3 py-1 bg-gray-900 text-white rounded-full font-light text-xs'}
                          >
                            저장
                          </button>
                          <button
                            onClick={() => setEditingReply(null)}
                            className={theme === 'gaming' ? 'px-3 py-1 bg-gradient-to-r from-gray-500 to-gray-600 text-white rounded-lg font-bold text-sm' : 'px-3 py-1 bg-gray-200 text-gray-700 rounded-full font-light text-xs'}
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className={theme === 'gaming' ? 'mb-2 text-gray-100' : theme === 'neon' ? 'mb-2 text-cyan-100' : theme === 'paper' ? 'mb-2 text-amber-900' : theme === 'comic' ? 'mb-2 text-black' : 'text-gray-700 mb-2 text-sm'}>
                          {reply.content}
                        </p>
                        
                        <button
                          onClick={() => onLike(comment.id, reply.id)}
                          className={themeClasses.likeButton(reply.isLiked)}
                        >
                          <Heart className={`w-3 h-3 ${reply.isLiked ? 'fill-current' : ''}`} />
                          <span>{reply.likes}</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CommentItem;
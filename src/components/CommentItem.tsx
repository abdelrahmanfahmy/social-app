import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Comment } from '../types';

interface CommentItemProps {
  comment: Comment;
  postId: string;
  onCommentDeleted: (commentId: string) => void;
  onCommentUpdated: (updatedComment: Comment) => void;
}

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  postId,
  onCommentDeleted,
  onCommentUpdated,
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content || '');
  const [likesCount, setLikesCount] = useState(
    comment.likesCount ?? comment.likes?.length ?? 0
  );
  const [isLiked, setIsLiked] = useState(
    Boolean(user && comment.likes?.includes(user._id))
  );
  const [loading, setLoading] = useState(false);

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  const isOwner = Boolean(
    user &&
      comment.commentCreator &&
      (comment.commentCreator._id === user._id || (comment as any).user?._id === user._id)
  );

  const handleLike = async () => {
    try {
      const res = await api.put(`/posts/${postId}/comments/${comment._id}/like`);
      if (res.data) {
        setIsLiked(!isLiked);
        setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
      }
    } catch {
    }
  };

  const handleUpdate = async () => {
    if (!content.trim()) return;
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('content', content.trim());

      const res = await api.put(
        `/posts/${postId}/comments/${comment._id}`,
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );

      if (res.data) {
        const updated = res.data.comment || res.data.data?.comment || { ...comment, content };
        onCommentUpdated(updated);
        setIsEditing(false);
      }
    } catch {
      alert('Failed to update comment');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/posts/${postId}/comments/${comment._id}`);
      onCommentDeleted(comment._id);
    } catch {
      alert('Failed to delete comment');
    }
  };

  return (
    <div className="flex gap-2.5 py-2.5 border-b border-slate-100 last:border-b-0 items-start">
      <img
        src={comment.commentCreator?.photo || defaultAvatar}
        alt={comment.commentCreator?.name || 'User'}
        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0 mt-0.5"
        onError={(e) => {
          (e.target as HTMLImageElement).src = defaultAvatar;
        }}
      />

      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2.5 inline-block max-w-full">
          <div className="flex items-center justify-between gap-4 mb-1">
            <span className="font-semibold text-xs text-slate-800">
              {comment.commentCreator?.name || 'User'}
            </span>
            <span className="text-[11px] text-slate-400">
              {comment.createdAt ? new Date(comment.createdAt).toLocaleDateString() : ''}
            </span>
          </div>

          {isEditing ? (
            <div className="flex gap-1.5 mt-1.5">
              <input
                type="text"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="px-2.5 py-1 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                onClick={handleUpdate}
                disabled={loading}
                className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs cursor-pointer font-medium"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setContent(comment.content);
                  setIsEditing(false);
                }}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-700 m-0 wrap-break-word leading-relaxed">{comment.content}</p>
          )}

          {comment.image && (
            <div className="mt-2">
              <img
                src={comment.image}
                alt="Comment attachment"
                className="max-h-36 rounded border border-slate-200"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1.5 ml-1 text-xs">
          <button
            onClick={handleLike}
            className={`px-2 py-0.5 rounded-md text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              isLiked
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'bg-[#f0f2f5] text-slate-600 hover:bg-slate-200'
            }`}
          >
            <span>👍</span>
            <span>{isLiked ? 'Liked' : 'Like'}</span>
            <span>({likesCount})</span>
          </button>

          {isOwner && !isEditing && (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-2 py-0.5 rounded-md bg-[#f0f2f5] text-slate-600 hover:bg-slate-200 transition cursor-pointer font-medium"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 hover:bg-rose-100 transition cursor-pointer font-medium"
              >
                Delete
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentItem;

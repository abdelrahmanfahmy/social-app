import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Post, Comment } from '../types';
import EditPostModal from './EditPostModal';
import CommentItem from './CommentItem';

interface PostCardProps {
  post: Post;
  onPostDeleted?: (postId: string) => void;
  onPostUpdated?: (updatedPost: Post) => void;
  showCommentsInitially?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  onPostDeleted,
  onPostUpdated,
  showCommentsInitially = false,
}) => {
  const { user } = useAuth();
  const [currentPost, setCurrentPost] = useState<Post>(post);
  const [isLiked, setIsLiked] = useState<boolean>(
    Boolean(user && (currentPost.likes?.includes(user._id) || false))
  );
  const [likesCount, setLikesCount] = useState<number>(
    currentPost.likesCount ?? currentPost.likes?.length ?? 0
  );
  const [editModalOpen, setEditModalOpen] = useState(false);

  const [showComments, setShowComments] = useState(showCommentsInitially);
  const [comments, setComments] = useState<Comment[]>(currentPost.comments || []);
  const [commentsLoaded, setCommentsLoaded] = useState(false);
  const [newCommentText, setNewCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  const isOwner = Boolean(
    user && currentPost.user && (currentPost.user._id === user._id || (currentPost as any).user === user._id)
  );

  const handleLike = async () => {
    try {
      const res = await api.put(`/posts/${currentPost._id}/like`);
      if (res.data) {
        setIsLiked(!isLiked);
        setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
      }
    } catch {
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${currentPost._id}`);
      if (onPostDeleted) {
        onPostDeleted(currentPost._id);
      }
    } catch {
      alert('Failed to delete post');
    }
  };

  const handlePostUpdated = (updated: Post) => {
    setCurrentPost(updated);
    if (onPostUpdated) {
      onPostUpdated(updated);
    }
  };

  const loadComments = async () => {
    if (commentsLoaded) {
      setShowComments(!showComments);
      return;
    }
    try {
      const res = await api.get(`/posts/${currentPost._id}/comments?limit=50`);
      const commentList =
        res.data?.data?.comments ||
        res.data?.comments ||
        (Array.isArray(res.data?.data) ? res.data.data : null);
      if (commentList) {
        setComments(commentList);
      }
      setCommentsLoaded(true);
      setShowComments(true);
    } catch {
      setShowComments(true);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    try {
      setSubmittingComment(true);
      const formData = new FormData();
      formData.append('content', newCommentText.trim());

      const res = await api.post(`/posts/${currentPost._id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data) {
        const createdComment = res.data.comment || res.data.data?.comment || {
          _id: Date.now().toString(),
          content: newCommentText.trim(),
          commentCreator: {
            _id: user?._id || '',
            name: user?.name || 'User',
            photo: user?.photo,
          },
          post: currentPost._id,
          createdAt: new Date().toISOString(),
        };

        setComments((prev) => [createdComment, ...prev]);
        setNewCommentText('');
        setShowComments(true);
      }
    } catch {
      alert('Failed to post comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c._id !== commentId));
  };

  const handleCommentUpdated = (updatedComment: Comment) => {
    setComments((prev) =>
      prev.map((c) => (c._id === updatedComment._id ? updatedComment : c))
    );
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            src={currentPost.user?.photo || defaultAvatar}
            alt={currentPost.user?.name || 'User'}
            className="w-10 h-10 rounded-full object-cover border border-slate-200"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultAvatar;
            }}
          />
          <div>
            <h4 className="font-semibold text-sm text-slate-800 m-0">
              {currentPost.user?.name || 'User'}
            </h4>
            <p className="text-xs text-slate-400 m-0">
              {currentPost.createdAt ? new Date(currentPost.createdAt).toLocaleDateString() : ''}
            </p>
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-2">
            <button
              onClick={() => setEditModalOpen(true)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 bg-[#f0f2f5] hover:bg-slate-200 rounded-md transition cursor-pointer"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition cursor-pointer"
            >
              Delete
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap wrap-break-word mb-3">
        {currentPost.body}
      </p>

      {currentPost.image && (
        <div className="mb-3 rounded-md overflow-hidden border border-slate-100 max-h-112.5 bg-slate-50 flex items-center justify-center">
          <img
            src={currentPost.image}
            alt="Post content"
            className="w-full object-cover max-h-112.5"
          />
        </div>
      )}

      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs font-medium text-slate-600">
        <div className="flex gap-2">
          <button
            onClick={handleLike}
            className={`px-3 py-1.5 rounded-md transition cursor-pointer flex items-center gap-1.5 ${
              isLiked
                ? 'bg-blue-50 text-blue-600 font-semibold'
                : 'bg-[#f0f2f5] text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span>👍</span>
            <span>{isLiked ? 'Liked' : 'Like'}</span>
            <span>({likesCount})</span>
          </button>

          <button
            onClick={loadComments}
            className="px-3 py-1.5 rounded-md bg-[#f0f2f5] text-slate-700 hover:bg-slate-200 transition cursor-pointer flex items-center gap-1.5"
          >
            <span>💬</span>
            <span>Comments ({comments.length > 0 ? comments.length : currentPost.commentsCount || 0})</span>
          </button>
        </div>

        <Link
          to={`/post/${currentPost._id}`}
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          View Details &rarr;
        </Link>
      </div>

      {showComments && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <form onSubmit={handleAddComment} className="flex gap-2 mb-3">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
            <button
              type="submit"
              disabled={submittingComment || !newCommentText.trim()}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              Send
            </button>
          </form>

          {comments.length > 0 ? (
            <div className="space-y-0.5">
              {comments.map((comment) => (
                <CommentItem
                  key={comment._id}
                  comment={comment}
                  postId={currentPost._id}
                  onCommentDeleted={handleCommentDeleted}
                  onCommentUpdated={handleCommentUpdated}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">No comments yet.</p>
          )}
        </div>
      )}

      {editModalOpen && (
        <EditPostModal
          post={currentPost}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onPostUpdated={handlePostUpdated}
        />
      )}
    </div>
  );
};

export default PostCard;

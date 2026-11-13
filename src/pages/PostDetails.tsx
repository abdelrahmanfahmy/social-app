import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Post, Comment } from '../types';
import CommentItem from '../components/CommentItem';
import EditPostModal from '../components/EditPostModal';

const PostDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const [editModalOpen, setEditModalOpen] = useState(false);

  const [newComment, setNewComment] = useState('');
  const [commentImage, setCommentImage] = useState<File | null>(null);
  const [submittingComment, setSubmittingComment] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  const isOwner = Boolean(
    user && post?.user && (post.user._id === user._id || (post as any).user === user._id)
  );

  useEffect(() => {
    const fetchPostAndComments = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const postRes = await api.get(`/posts/${id}`);
        const postData =
          postRes.data?.data?.post ||
          postRes.data?.post ||
          (postRes.data?.data && !Array.isArray(postRes.data.data) ? postRes.data.data : postRes.data);
        setPost(postData);

        const currentLikes = postData.likesCount ?? postData.likes?.length ?? 0;
        setLikesCount(currentLikes);
        setIsLiked(Boolean(user && postData.likes?.includes(user._id)));

        try {
          const commentsRes = await api.get(`/posts/${id}/comments?limit=50`);
          const commentsList =
            commentsRes.data?.data?.comments ||
            commentsRes.data?.comments ||
            (Array.isArray(commentsRes.data?.data) ? commentsRes.data.data : null);
          if (commentsList) {
            setComments(commentsList);
          } else if (postData.comments) {
            setComments(postData.comments);
          }
        } catch {
          if (postData.comments) {
            setComments(postData.comments);
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load post.');
      } finally {
        setLoading(false);
      }
    };

    fetchPostAndComments();
  }, [id, user]);

  const handleLike = async () => {
    if (!id) return;
    try {
      const res = await api.put(`/posts/${id}/like`);
      if (res.data) {
        setIsLiked(!isLiked);
        setLikesCount((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
      }
    } catch {
    }
  };

  const handleDeletePost = async () => {
    if (!id || !window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/posts/${id}`);
      navigate('/');
    } catch {
      alert('Failed to delete post');
    }
  };

  const handleCommentImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCommentImage(e.target.files[0]);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || (!newComment.trim() && !commentImage)) return;

    try {
      setSubmittingComment(true);
      const formData = new FormData();
      if (newComment.trim()) {
        formData.append('content', newComment.trim());
      }
      if (commentImage) {
        formData.append('image', commentImage);
      }

      const res = await api.post(`/posts/${id}/comments`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data) {
        const created = res.data.comment || res.data.data?.comment || {
          _id: Date.now().toString(),
          content: newComment.trim(),
          commentCreator: {
            _id: user?._id || '',
            name: user?.name || 'User',
            photo: user?.photo,
          },
          post: id,
          createdAt: new Date().toISOString(),
        };

        setComments((prev) => [created, ...prev]);
        setNewComment('');
        setCommentImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
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

  if (loading) {
    return <div className="text-center py-12 text-sm text-slate-500">Loading post...</div>;
  }

  if (error || !post) {
    return (
      <div className="max-w-162.5 mx-auto px-4 py-12 text-center">
        <p className="text-rose-600 font-medium mb-3">{error || 'Post not found.'}</p>
        <Link to="/" className="text-blue-600 hover:underline text-sm">
          &larr; Back to Feed
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-162.5 mx-auto px-4 py-6">
      <div className="mb-4">
        <Link to="/" className="text-xs font-medium text-slate-600 hover:text-blue-600 transition">
          &larr; Back to Feed
        </Link>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <img
              src={post.user?.photo || defaultAvatar}
              alt={post.user?.name || 'User'}
              className="w-10 h-10 rounded-full object-cover border border-slate-200"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultAvatar;
              }}
            />
            <div>
              <h3 className="font-semibold text-sm text-slate-800 m-0">{post.user?.name}</h3>
              <p className="text-xs text-slate-400 m-0">
                {post.createdAt ? new Date(post.createdAt).toLocaleDateString() : ''}
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
                onClick={handleDeletePost}
                className="px-2.5 py-1 text-xs font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition cursor-pointer"
              >
                Delete
              </button>
            </div>
          )}
        </div>

        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-wrap wrap-break-word mb-3">
          {post.body}
        </p>

        {post.image && (
          <div className="mb-3 rounded-md overflow-hidden border border-slate-100 max-h-112.5 bg-slate-50 flex items-center justify-center">
            <img
              src={post.image}
              alt="Post media"
              className="w-full object-cover max-h-112.5"
            />
          </div>
        )}

        <div className="pt-2.5 border-t border-slate-100 flex items-center gap-2 text-xs font-medium text-slate-600">
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
          <div className="px-3 py-1.5 rounded-md bg-[#f0f2f5] text-slate-700 flex items-center gap-1.5">
            <span>💬</span>
            <span>{comments.length} Comments</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5">
        <h4 className="font-bold text-sm text-slate-800 mb-3">Comments ({comments.length})</h4>

        <form onSubmit={handleAddComment} className="mb-4">
          <textarea
            rows={2}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none transition"
          />

          <div className="flex items-center justify-between mt-2">
            <div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleCommentImage}
                className="hidden"
                id="comment-image-picker"
              />
              <label
                htmlFor="comment-image-picker"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-[#f0f2f5] hover:bg-slate-200 rounded-md cursor-pointer transition"
              >
                <span>📷 Add Photo</span>
                {commentImage && <span className="text-blue-600 text-[11px]">({commentImage.name})</span>}
              </label>
            </div>

            <button
              type="submit"
              disabled={submittingComment || (!newComment.trim() && !commentImage)}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-xs font-medium transition cursor-pointer disabled:opacity-50"
            >
              Add Comment
            </button>
          </div>
        </form>

        {comments.length > 0 ? (
          <div className="space-y-1">
            {comments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                postId={id!}
                onCommentDeleted={handleCommentDeleted}
                onCommentUpdated={handleCommentUpdated}
              />
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 text-center py-4">No comments yet.</p>
        )}
      </div>

      {editModalOpen && (
        <EditPostModal
          post={post}
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onPostUpdated={(updated) => setPost(updated)}
        />
      )}
    </div>
  );
};

export default PostDetails;

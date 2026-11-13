import React, { useState, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';

interface CreatePostBoxProps {
  onPostCreated: (newPost: Post) => void;
}

const CreatePostBox: React.FC<CreatePostBoxProps> = ({ onPostCreated }) => {
  const { user } = useAuth();
  const [body, setBody] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim() && !image) {
      setError('Post body or image cannot be empty');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const formData = new FormData();
      if (body.trim()) {
        formData.append('body', body.trim());
      }
      if (image) {
        formData.append('image', image);
      }

      const res = await api.post('/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data) {
        const createdPost =
          res.data.post ||
          res.data.data?.post ||
          res.data.data || {
            ...res.data,
            user: user,
            createdAt: new Date().toISOString(),
            likesCount: 0,
            commentsCount: 0,
          };
        onPostCreated(createdPost);
        setBody('');
        setImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create post.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-4 sm:p-5 mb-5">
      <div className="flex gap-3 items-start">
        <img
          src={user?.photo || defaultAvatar}
          alt={user?.name || 'User'}
          className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultAvatar;
          }}
        />

        <div className="flex-1">
          <form onSubmit={handleSubmit}>
            <textarea
              rows={3}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`What's on your mind, ${user?.name?.split(' ')[0] || ''}?`}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-blue-500 resize-none transition"
            />

            {image && (
              <div className="flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-md text-xs text-slate-700 mt-2">
                <span>Selected: {image.name}</span>
                <button
                  type="button"
                  onClick={() => {
                    setImage(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-rose-600 hover:text-rose-700 font-medium cursor-pointer"
                >
                  Remove
                </button>
              </div>
            )}

            {error && (
              <div className="text-xs text-rose-600 mt-2 font-medium">{error}</div>
            )}

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <div>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  className="hidden"
                  id="post-image-file"
                />
                <label
                  htmlFor="post-image-file"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-[#f0f2f5] hover:bg-slate-200 rounded-md cursor-pointer transition"
                >
                  <span>📷 Add Photo</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading || (!body.trim() && !image)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {loading ? 'Posting...' : 'Publish'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreatePostBox;

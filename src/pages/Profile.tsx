import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { Post } from '../types';
import PostCard from '../components/PostCard';

const Profile: React.FC = () => {
  const { user, refreshUser, updateUser } = useAuth();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80';

  useEffect(() => {
    const fetchUserPosts = async () => {
      if (!user?._id) return;
      try {
        setLoadingPosts(true);
        const res = await api.get(`/users/${user._id}/posts`);
        const postsList =
          res.data?.data?.posts ||
          res.data?.posts ||
          (Array.isArray(res.data?.data) ? res.data.data : null);

        if (postsList) {
          setUserPosts(postsList);
        } else {
          const allRes = await api.get('/posts?limit=50');
          const allPosts =
            allRes.data?.data?.posts ||
            allRes.data?.posts ||
            (Array.isArray(allRes.data?.data) ? allRes.data.data : []);
          setUserPosts(
            allPosts.filter(
              (p: Post) => p.user?._id === user._id || (p as any).user === user._id
            )
          );
        }
      } catch {
        try {
          const allRes = await api.get('/posts?limit=50');
          const allPosts =
            allRes.data?.data?.posts ||
            allRes.data?.posts ||
            (Array.isArray(allRes.data?.data) ? allRes.data.data : []);
          setUserPosts(
            allPosts.filter(
              (p: Post) => p.user?._id === user._id || (p as any).user === user._id
            )
          );
        } catch {
        }
      } finally {
        setLoadingPosts(false);
      }
    };

    fetchUserPosts();
  }, [user?._id]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('photo', file);

      try {
        setUploadingPhoto(true);
        setPhotoMessage(null);
        const res = await api.put('/users/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (res.data) {
          setPhotoMessage('Profile photo updated successfully!');
          const newPhoto =
            res.data?.data?.user?.photo || res.data?.user?.photo || res.data?.photo;
          if (newPhoto) {
            updateUser({ photo: newPhoto });
          } else {
            await refreshUser();
          }
        }
      } catch (err: any) {
        setPhotoMessage(err.response?.data?.message || 'Failed to upload photo.');
      } finally {
        setUploadingPhoto(false);
      }
    }
  };

  const handlePostDeleted = (postId: string) => {
    setUserPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setUserPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  return (
    <div className="max-w-162.5 mx-auto px-4 py-6">
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-5 sm:p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 pb-5 border-b border-slate-100">
          <div className="relative">
            <img
              src={user?.photo || defaultAvatar}
              alt="Profile"
              className="w-20 h-20 rounded-full object-cover border-2 border-slate-200 shadow-xs"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultAvatar;
              }}
            />
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="mt-2 block w-full text-center px-2 py-1 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md border border-slate-300 transition cursor-pointer"
            >
              {uploadingPhoto ? 'Uploading...' : 'Change Photo'}
            </button>
          </div>

          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-800 m-0">{user?.name}</h2>
            <p className="text-sm text-slate-500 m-0 mt-0.5">@{user?.username || 'user'}</p>
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <Link
                to="/change-password"
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-md border border-slate-200 transition"
              >
                Change Password
              </Link>
            </div>
          </div>
        </div>

        {photoMessage && (
          <div className="mt-4 p-2.5 bg-blue-50 border border-blue-200 text-blue-700 text-xs rounded-md">
            {photoMessage}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 text-xs text-slate-600">
          <div><span className="font-semibold text-slate-700">Email:</span> {user?.email}</div>
          <div><span className="font-semibold text-slate-700">Gender:</span> {user?.gender || 'Not specified'}</div>
          <div><span className="font-semibold text-slate-700">Date of Birth:</span> {user?.dateOfBirth ? new Date(user.dateOfBirth).toLocaleDateString() : 'Not provided'}</div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-base font-bold text-slate-800">My Posts ({userPosts.length})</h3>
      </div>

      {loadingPosts ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-500">
          Loading posts...
        </div>
      ) : userPosts.length > 0 ? (
        <div>
          {userPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPostDeleted={handlePostDeleted}
              onPostUpdated={handlePostUpdated}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-slate-500 text-sm">
          You haven't posted anything yet.
        </div>
      )}
    </div>
  );
};

export default Profile;

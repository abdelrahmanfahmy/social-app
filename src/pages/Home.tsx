import React, { useEffect, useState } from 'react';
import api from '../services/api';
import type { Post } from '../types';
import PostCard from '../components/PostCard';
import CreatePostBox from '../components/CreatePostBox';

const Home: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPosts = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const res = await api.get('/posts?limit=50');
      const postsList =
        res.data?.data?.posts ||
        res.data?.posts ||
        (Array.isArray(res.data?.data) ? res.data.data : null);

      if (postsList) {
        setPosts(postsList);
      }
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load posts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handlePostCreated = (newPost: Post) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handlePostDeleted = (postId: string) => {
    setPosts((prev) => prev.filter((p) => p._id !== postId));
  };

  const handlePostUpdated = (updatedPost: Post) => {
    setPosts((prev) =>
      prev.map((p) => (p._id === updatedPost._id ? updatedPost : p))
    );
  };

  return (
    <div className="max-w-162.5 mx-auto px-4 py-6">
      <CreatePostBox onPostCreated={handlePostCreated} />

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-slate-800 tracking-tight">Recent Feed</h2>
        <button
          onClick={() => fetchPosts(true)}
          disabled={refreshing}
          className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-xs transition cursor-pointer disabled:opacity-50"
        >
          {refreshing ? 'Refreshing...' : '🔄 Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-8 text-center text-sm text-slate-500">
          Loading posts...
        </div>
      ) : posts.length > 0 ? (
        <div>
          {posts.map((post) => (
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
          No posts available right now. Be the first to publish one!
        </div>
      )}
    </div>
  );
};

export default Home;

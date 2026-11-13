export interface User {
  _id: string;
  name: string;
  email: string;
  username?: string;
  dateOfBirth?: string;
  gender?: string;
  photo?: string;
  createdAt?: string;
}

export interface CommentCreator {
  _id: string;
  name: string;
  photo?: string;
  username?: string;
}

export interface Comment {
  _id: string;
  content: string;
  commentCreator: CommentCreator;
  post: string;
  image?: string;
  createdAt: string;
  likes?: string[];
  likesCount?: number;
}

export interface Post {
  _id: string;
  body: string;
  image?: string;
  user: User;
  createdAt: string;
  likesCount?: number;
  commentsCount?: number;
  likes?: string[];
  comments?: Comment[];
}

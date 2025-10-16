import { useEffect,useState } from "react";
import {Link} from "react-router-dom";
import '../App.css';

const Post = (props) => (
  <tr>
    <td>{props.post.title}</td>
    <td>{props.post.content}</td>
   {props.post.image && <td><img src={props.post.image} alt="Post" width="100"/></td>}

    <td>
      <Link className="btn btn-link" to={`/edit/${props.post._id}`}>Edit</Link> | <a className="btn btn-link"
        href="#" onClick={() => { props.deletePost(props.post._id); }}>Delete</a>
    </td>
  </tr>
);

export default function PostList() {
  const [posts, setPosts] = useState([]);

    useEffect(() => {
async function getPosts() 
{
    const response = await fetch(`http://localhost:3000/user/posts`);

    if (!response.ok) {
      const message = `An error occurred: ${response.statusText}`;
      window.alert(message);
      return;
    }
    const posts = await response.json();
    setPosts(posts);
    
}
    
getPosts();
return;
}, [posts.length]);

  // This method will delete a post
  async function deletePost(id) {
    await fetch(`http://localhost:3000/user/posts/${id}`, {
      method: "DELETE",
      headers: {
        "Authorization": 'Bearer ${token}',
      },
    });
    const newPosts = posts.filter((el) => el._id !== id);
    setPosts(newPosts);
  }

  function PostList() {
    return posts.map((post) => {
      return (
        <Post
          post={post}
          deletePost={() => deletePost(post._id)}
          key={post._id}
        />
      );
    });
}

return (
    <body>
    <div className="container">
      <h3>Posts</h3>
      <table className="table table-striped" style={{ marginTop: 20 }}>
        <thead>
          <tr>
            <th>Title</th>
            <th>Content</th>
            <th>Image</th>
            <th>Actions</th>
            </tr>
        </thead>
        <tbody>{PostList()}</tbody>
        </table>
    </div>
    </body>
);
}

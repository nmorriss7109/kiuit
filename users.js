let users = new Map();

const addUser = (id, name, room) => {
  if ((getUsers(room).find((user) => user.name == name)) == undefined) return { error: "Username has already been taken for that room." };
  if (!name && !room) return { error: "Username and room are required" };
  if (!name) return { error: "Username is required" };
  if (!room) return { error: "Room is required" };

  const user = {id, name, room};
  users.set(id, user);
  return user;
}

const deleteUser = (id) => {
  const user = users.get(id);
  users.delete(id);
  return user;
}

const getUser = (id) => {
  return users.get(id);
}

const getUsers = (room) => {
  userArray = Array.from(users);
  return userArray.filter((user) => user.room == room);
}

module.exports = { addUser, deleteUser, getUser, getUsers };
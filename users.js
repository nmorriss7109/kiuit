// let users = new Map();

// const addUser = (id, name, room) => {
//   console.log(getUsers(room));
  // if ((getUsers(room).find((user) => user.name == name)) != undefined) {
    
  //   throw new Error("Username has already been taken for that room." );
  // }
  // if (!name && !room) throw new Error("Username and room are required");
  // if (!name) throw new Error("Username is required");
  // if (!room) throw new Error("Room is required");

//   var isHost = false;
//   console.log(`room users: ${getUsers(room)}`);
//   if (getUsers(room) == null) isHost = true;

//   const user = { name, room, isHost };
//   users.set(id, user);
//   return user;
// }

// const deleteUser = (id) => {
//   const user = users.get(id);
//   users.delete(id);
//   return user;
// }

// const getUser = (id) => {
//   return users.get(id);
// }

// const getUsers = (room) => {
//   users.set('n', 'v');
//   users.set('m', 'b');
//   const userArray = Array.from(users.values());
//   console.log(`arr: ${userArray}`);
//   return userArray.filter((user) => user.room == room);
// }

// const getAllUsers = () => {
//   return Array.from(users);
// }

// module.exports = { addUser, deleteUser, getUser, getUsers, getAllUsers };
const users = []

const addUser = (id, name, room) => {
    const existingUser = users.find(user => user.name.trim().toLowerCase() === name.trim().toLowerCase())

    // if (existingUser) return { error: "Username has already been taken" }
    // if (!name && !room) return { error: "Username and room are required" }
    // if (!name) return { error: "Username is required" }
    // if (!room) return { error: "Room is required" }
    if ((getUsers(room).find((user) => user.name == name)) != undefined) {
      throw new Error("Username has already been taken for that room." );
    }
    if (!name && !room) throw new Error("Username and room are required");
    if (!name) throw new Error("Username is required");
    if (!room) throw new Error("Room is required");

    const host = (getUsers(room).length == 0);

    const user = { id, name, room, host }
    users.push(user)
    console.log(users);
    return user
}

const getUser = id => {
    let user = users.find(user => user.id == id)
    return user
}

const deleteUser = (id) => {
    const index = users.findIndex((user) => user.id === id);
    if (index !== -1) return users.splice(index, 1)[0];
}

const getUsers = (room) => users.filter(user => user.room === room)

module.exports = { addUser, getUser, deleteUser, getUsers }
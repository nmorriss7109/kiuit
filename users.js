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
    console.log(getUsers(room));
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

export { addUser, getUser, deleteUser, getUsers };
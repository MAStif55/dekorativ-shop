use dekorativ_data; 
db.createUser({
    user: "dekorativ_app", 
    pwd: "DekorativAppPass2026", 
    roles: [{role: "readWrite", db: "dekorativ_data"}]
});

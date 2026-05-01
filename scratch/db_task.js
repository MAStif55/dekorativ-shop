db.products.updateMany({ id: { $exists: true, $type: "string" } }, { $unset: { id: "" } });
const cats = db.categories.find().toArray();
console.log(JSON.stringify(cats, null, 2));

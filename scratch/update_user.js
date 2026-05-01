db.admin_users.updateOne({email: 'swj20862@gmail.com'}, {$set: {passwordHash: '75d61843d5928bb9170e01adf97296f7ed81edea1c0d87eb4d96db8a8fdafa7f', displayName: 'Admin'}}, {upsert: true});

const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const hash = await bcrypt.hash('admin123', 10);
    await queryInterface.bulkInsert('users', [{
      username: 'admin',
      password_hash: hash,
      name: 'Administrator',
      role: 'admin',
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  },
};

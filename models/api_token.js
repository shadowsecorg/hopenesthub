'use strict';

const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ApiToken extends Model {
    static associate(models) {
      ApiToken.belongsTo(models.User, { foreignKey: 'user_id' });
    }
  }

  ApiToken.init(
    {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      user_id: { type: DataTypes.INTEGER },
      token: { type: DataTypes.TEXT },
      expires_at: { type: DataTypes.DATE }
    },
    {
      sequelize,
      modelName: 'ApiToken',
      tableName: 'api_tokens',
      timestamps: false
    }
  );

  return ApiToken;
};



const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // ⭐ CAMBIO: Se elimina el segundo argumento (el objeto de opciones)
    const conn = await mongoose.connect(process.env.MONGO_URI); 

    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
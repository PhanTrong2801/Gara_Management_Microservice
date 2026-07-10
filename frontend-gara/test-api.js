const axios = require('axios');
axios.get('http://localhost:8080/api/repair/orders?page=0&size=10')
  .then(res => console.log(JSON.stringify(Object.keys(res.data))))
  .catch(err => console.log(err.message));

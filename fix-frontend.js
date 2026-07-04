const fs = require('fs');

const fixCustomersData = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/customersRes\.data\.forEach/g, '(customersRes.data.content || customersRes.data || []).forEach');
    fs.writeFileSync(file, content);
};

fixCustomersData('frontend-gara/src/pages/repair/AppointmentManagement.jsx');
fixCustomersData('frontend-gara/src/pages/repair/RepairOrderList.jsx');

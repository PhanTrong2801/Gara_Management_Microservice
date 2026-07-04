const fs = require('fs');

const fixPartsData = (file) => {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/partsRes\.data\.forEach/g, '(partsRes.data.content || partsRes.data || []).forEach');
    fs.writeFileSync(file, content);
};

fixPartsData('frontend-gara/src/pages/repair/RepairOrderList.jsx');

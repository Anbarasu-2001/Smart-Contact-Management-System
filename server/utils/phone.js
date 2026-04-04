
function formatPhone(phone) {
    phone = String(phone || '').replace(/\D/g, "");
    if (phone.length === 10) return "+91" + phone;
    if (phone.length === 11 && phone.startsWith("1")) return "+1" + phone.slice(1);
    if (phone.length === 12 && phone.startsWith("91")) return "+" + phone;
    if (phone.length === 12 && phone.startsWith("1")) return "+" + phone;
    return "+" + phone;
}

module.exports = {
    formatPhone,
};

export const getCheckoutShippingInfo = (reduxInfo = {}, userId) => {
    let storedInfo = {};

    try {
        const accountInfo = userId
            ? localStorage.getItem(`shippingInfo_${userId}`)
            : null;
        const guestInfo = localStorage.getItem('guest_shippingInfo');
        storedInfo = JSON.parse(accountInfo || guestInfo || '{}') || {};
    } catch (error) {
        console.error('Could not read saved shipping information:', error);
    }

    // Prefer current Redux values, but retain saved values if Redux was reset.
    return Object.entries({ ...storedInfo, ...reduxInfo }).reduce(
        (result, [key, value]) => {
            result[key] = value === undefined || value === null || value === ''
                ? (storedInfo[key] ?? value)
                : value;
            return result;
        },
        {}
    );
};

export const hasRequiredShippingInfo = (info = {}) =>
    ['address', 'city', 'postalCode', 'phoneNo', 'country'].every(
        field => String(info[field] || '').trim().length > 0
    );

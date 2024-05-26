//Function to generate initials from display name
export const getInitials = (displayName: string) => {
    // Split the name by spaces
    const nameParts = displayName.split(' ');
    // Map and get the first and last name, then join them
    // @ts-ignore
    const initials = nameParts.slice(0, 2).map(part => part && part.length > 0 && part[0].toUpperCase() || '').join('');
    return initials;
}
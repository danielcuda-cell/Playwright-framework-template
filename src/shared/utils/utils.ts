export function generateValidPassword(length: number = 12): string {

    if (length < 8) {
        throw new Error("Password length must be at least 8 characters");
    }

    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const digits = "0123456789";
    const special = "!@#$%^&*()-_=+[]{}|;:,.<>?/";

    const allChars = upper + lower + digits + special;

    const getRandomChar = (chars: string) =>
        chars[Math.floor(Math.random() * chars.length)];

    const passwordChars: string[] = [
        getRandomChar(upper),
        getRandomChar(lower),
        getRandomChar(digits),
        getRandomChar(special),
    ];

    while (passwordChars.length < length) {
        passwordChars.push(getRandomChar(allChars));
    }

    for (let i = passwordChars.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [passwordChars[i], passwordChars[j]] = [
            passwordChars[j],
            passwordChars[i],
        ];
    }

    return passwordChars.join("");
}

export function generateRandomString(
    length: number = 8,
    chars: string = "abcdefghijklmnopqrstuvwxyz"
): string {
    const getRandomChar = (chars: string) =>
        chars[Math.floor(Math.random() * chars.length)];

    return Array.from({ length }, () => getRandomChar(chars)).join("");
}
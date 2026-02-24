export const SPECIAL_CHARS = "()!@#$%^&*|?><_-";

export function validatePassword(password: string): { isValid: boolean; message?: string } {
    if (!password) return { isValid: false, message: "密码不能为空" };

    // 1. 长度 8-32
    if (password.length < 8 || password.length > 32) {
        return { isValid: false, message: "密码长度需在 8 到 32 位之间" };
    }

    // 2. 开头不能是特殊字符
    // 特殊字符集合: ()!@#$%^&*|?><_-
    const firstChar = password.charAt(0);
    if (SPECIAL_CHARS.includes(firstChar)) {
        return { isValid: false, message: "密码不能以特殊字符开头" };
    }

    // 3. 至少包含 3 种字符类型
    let typesCount = 0;
    if (/[a-z]/.test(password)) typesCount++;
    if (/[A-Z]/.test(password)) typesCount++;
    if (/[0-9]/.test(password)) typesCount++;

    // Check for special chars using includes for safety and simplicity, or regex with escaped chars
    // Using regex for scanning the whole string is better
    // Escape special chars for regex: \ and ] and - need care. 
    // The list is: ( ) ! @ # $ % ^ & * | ? > < _ -
    // Regex char class: [()!@#$%^&*|?><_-]
    // In JS regex, - in the middle needs escaping or being at the end. ] is not in our list. \ is not in our list.
    // So [()!@#$%^&*|?><_-] should work if - is last.
    if (/[()!@#$%^&*|?><_\-]/.test(password)) typesCount++;

    if (typesCount < 3) {
        return { isValid: false, message: "密码需至少包含大写字母、小写字母、数字、特殊字符中的三种" };
    }

    return { isValid: true };
}

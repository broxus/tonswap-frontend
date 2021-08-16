export enum StorageType {
    LOCAL = 'localStorage',
    SESSION = 'sessionStorage',
}

function available(type: StorageType = StorageType.LOCAL): boolean {
    const storage = window[type]
    try {
        const x = '__storage_test__'
        storage.setItem(x, x)
        storage.removeItem(x)
        return true
    }
    catch (e) {
        return e instanceof DOMException && (
            // everything except Firefox
            e.code === 22
            // Firefox
            || e.code === 1014
            // test name field too, because code might not be present
            // everything except Firefox
            || e.name === 'QuotaExceededError'
            // Firefox
            || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')
            // acknowledge QuotaExceededError only if there's something already stored
            && storage.length !== 0
    }
}

function get(key: string, type: StorageType = StorageType.LOCAL): string | null {
    if (available(type)) {
        try {
            return window[type].getItem(key)
        }
        catch (e) {
            return null
        }
    }
    return null
}

function set(key: string, value: string, type: StorageType = StorageType.LOCAL): void {
    if (available(type)) {
        try {
            window[type].setItem(key, value)
        }
        catch (e) {
            //
        }
    }
}

function remove(key: string, type: StorageType = StorageType.LOCAL): void {
    if (available(type)) {
        try {
            window[type].removeItem(key)
        }
        catch (e) {
            //
        }
    }
}

export const storage = {
    available,
    get,
    set,
    remove,
}

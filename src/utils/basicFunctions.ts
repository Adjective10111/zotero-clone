// check for emptiness
export const isEmpty = (obj: object): boolean => 
	Object.keys(obj).length <= 0;

// check for duplication
export const hasDuplicates = (array: any[]): boolean => {
	const valuesSoFar = Object.create(null);
	for (let i = 0; i < array.length; ++i) {
		const value = array[i];
		if (value in valuesSoFar) {
			return true;
		}
		valuesSoFar[value] = true;
	}
	return false;
};

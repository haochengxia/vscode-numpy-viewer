# create a numpy array with fp16
import numpy as np

fp16_array = np.array([1.0, 2.0, 3.0], dtype=np.float16)
np.save('fp16_array.npy', fp16_array)


# save a .npz file with fp16
fp16_array2 = np.array([4.0, 5.0, 6.0], dtype=np.float16)
np.savez('fp16_array.npz', a=fp16_array, b=fp16_array2)

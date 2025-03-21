# Numpy file viewer

[![Version](https://img.shields.io/visual-studio-marketplace/v/Percy.vscode-numpy-viewer?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=Percy.vscode-numpy-viewer)
[![Installs](https://img.shields.io/visual-studio-marketplace/i/Percy.vscode-numpy-viewer?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=Percy.vscode-numpy-viewer)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)
[![Build and Test](https://github.com/haochengxia/vscode-numpy-viewer/workflows/Build%20&%20Test/badge.svg)](https://github.com/haochengxia/vscode-numpy-viewer/actions/workflows/build-and-test.yml)

<!-- [![Downloads](https://img.shields.io/visual-studio-marketplace/d/Percy.vscode-numpy-viewer?style=flat-square)](https://marketplace.visualstudio.com/items?itemName=Percy.vscode-numpy-viewer) -->
<!-- [![Rating](https://img.shields.io/visual-studio-marketplace/r/Percy.vscode-numpy-viewer?style=flat-square&token=)](https://marketplace.visualstudio.com/items?itemName=Percy.vscode-numpy-viewer) -->

> ! Displaying very large arrays (e.g., size > 10,000,000) is not currently supported.

Display (binary) `.npy` or `.npz` files in VSCode.

![img](https://github.com/haochengxia/vscode-numpy-viewer/blob/screenshot/screenshot.gif?raw=true)

## Change log

Please refer to [CHANGELOG.md](./CHANGELOG.md).

## Other Features

- [x] Show array shape. [[see gif]](https://github.com/haochengxia/vscode-numpy-viewer/blob/screenshot/feature_shape.gif?raw=true)
- [x] Table view for 2D/1D array. [[see gif]](https://github.com/haochengxia/vscode-numpy-viewer/blob/screenshot/feature_tableview.gif?raw=true)
- [ ] Array slice. (In progress)

## Supported Data Type

Refer: [numpy/typing/tests/data/pass/scalars.py](https://github.com/numpy/numpy/blob/main/numpy/typing/tests/data/pass/scalars.py) | [numpy/typing/tests/test_typing.py](https://github.com/numpy/numpy/blob/main/numpy/typing/tests/test_typing.py#L230)

| Status | Name | Description | Abbrev |
| ------ | ---- | ----------- | ------ |
| ✅ | uint8 | numpy.unsignedinteger[numpy._typing._8Bit] | u1 |
| ✅ | uint16 | numpy.unsignedinteger[numpy._typing._16Bit] | u2 |
| ✅ | uint32 | numpy.unsignedinteger[numpy._typing._32Bit] | u4 |
| ✅ | uint64 | numpy.unsignedinteger[numpy._typing._64Bit] | u8 |
| ✅ | **int8** | numpy.signedinteger[numpy._typing._8Bit] | i1 |
| ✅ | int16 | numpy.signedinteger[numpy._typing._16Bit] | i2 |
| ✅ | int32 | numpy.signedinteger[numpy._typing._32Bit] | i4 |
| ✅ | int64 | numpy.signedinteger[numpy._typing._64Bit] | i8 |
| ✅ | float16 | numpy.floating[numpy._typing._16Bit] | f2 |
| ✅ | float32 | numpy.floating[numpy._typing._32Bit] | f4 |
| ✅ | **float64** | numpy.floating[numpy._typing._64Bit] | f8 |
| | float128 | numpy.floating[numpy._typing._128Bit] | f16 |
| | complex64 | numpy.complexfloating[numpy._typing._32Bit, numpy._typing._32Bit] | c8 |
|✅ | **complex128** | numpy.complexfloating[numpy._typing._64Bit, numpy._typing._64Bit] | c16 |
| | complex256 | numpy.complexfloating[numpy._typing._128Bit, numpy._typing._128Bit] | c32 |
| ✅ | bool_ | | b1 |
| ✅ | str_ | | U |
| ✅ | bytes_ | | S |
| | datetime64 | | M |
| | timedelta64 | | m |
| ***Alias*** | | | |
| | ubyte | numpy.unsignedinteger[{dct['_NBitByte']}] | |
| | ushort | numpy.unsignedinteger[{dct['_NBitShort']}] | |
| | uintc | numpy.unsignedinteger[{dct['_NBitIntC']}] | |
| | uintp | numpy.unsignedinteger[{dct['_NBitIntP']}] | |
| | uint | numpy.unsignedinteger[{dct['_NBitInt']}] | |
| | ulonglong | numpy.unsignedinteger[{dct['_NBitLongLong']}] | |
| | byte | numpy.signedinteger[{dct['_NBitByte']}] | |
| | short | numpy.signedinteger[{dct['_NBitShort']}] | |
| | intc | numpy.signedinteger[{dct['_NBitIntC']}] | |
| | intp | numpy.signedinteger[{dct['_NBitIntP']}] | |
| | int_ | numpy.signedinteger[{dct['_NBitInt']}] | |
| | longlong | numpy.signedinteger[{dct['_NBitLongLong']}] | |
| | half | numpy.floating[{dct['_NBitHalf']}] | |
| | single | numpy.floating[{dct['_NBitSingle']}] | |
| | double | numpy.floating[{dct['_NBitDouble']}] | |
| | longdouble | numpy.floating[{dct['_NBitLongDouble']}] | |
| | csingle | numpy.complexfloating[{dct['_NBitSingle']}, {dct['_NBitSingle']}] | |
| | cdouble | numpy.complexfloating[{dct['_NBitDouble']}, {dct['_NBitDouble']}] | |
| | clongdouble | numpy.complexfloating[{dct['_NBitLongDouble']}, {dct['_NBitLongDouble']}] | |

\* **bold items** are defaults.

## Reference

- [ludwigschubert/js-numpy-parser](https://github.com/ludwigschubert/js-numpy-parser)
- [tomoki1207/vscode-pdfviewer](https://github.com/tomoki1207/vscode-pdfviewer)
- [janisdd/vscode-edit-csv](https://github.com/janisdd/vscode-edit-csv)

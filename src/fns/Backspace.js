const FnAdditional = require('../interface/FnAdditional')

const Option = require('../enums/CursorManager')

class Backspace extends FnAdditional {
    constructor () {
        super()
        this.name = 'backspace'
        this.hooks = [
        ]
    }

    /**
     * 1. 对于一次 Backspace，只处理那些有选区的光标，其他的不做删除操作
     * 2. 光标在大于第一行的行首处，删除该行，并将光标后的内容剪贴到上一行
     */
    do (content) {
        /* 1 */
        let handled = false

        this.cursor.traverse((cursor) => {
            cursor.resetOffset()

            if (cursor.isSelectionExist()) {
                cursor.removeSelectionContent()
                handled = true
            }
        })

        if (!handled) {
            this.cursor.do((cursor) => {
                if (cursor.logicalX > 0) {
                    this.line.deleteContent(cursor.logicalY, cursor.logicalX - 1, cursor.logicalX)
                    cursor.logicalX -= 1
                    return
                }

                /* 2 */
                if (cursor.logicalY > 0) {
                    let content = cursor.contentAround()
                    this.line.delete(cursor.logicalY)
                    cursor.logicalY -= 1
                    cursor.xToEnd()
                    this.line.insertContent(cursor.logicalY, cursor.logicalX, content.after)
                    return
                }
            }, Option.NOT_REMOVE_SELECTION)
        }


        return content
    }

    undo (step) {
        let {before, after} = step

        let afterX = []
        this.cursor.deserialize(after)
        this.cursor.traverse((cursor) => {
            afterX.push(cursor.logicalX)
        })

        let beforeX = []
        this.cursor.deserialize(before)
        this.cursor.traverse((cursor) => {
            beforeX.push(cursor.logicalX)
        })

        this.cursor.do((cursor, index) => {
            this.line.deleteContent(cursor.logicalY, beforeX[index], afterX[index])
        })

        this.cursor.active()
    }

    redo (step) {
        let {before, after, content} = step

        let beforeY = []
        let beforeX = []

        this.cursor.deserialize(before)

        this.cursor.traverse((cursor) => {
            beforeY.push(cursor.logicalY)
            beforeX.push(cursor.logicalX)
        })

        this.cursor.deserialize(after)

        this.cursor.do((cursor, index) => {
            this.line.insertContent(beforeY[index], beforeX[index], content)
        })

        this.cursor.active()
    }
}

module.exports = Backspace

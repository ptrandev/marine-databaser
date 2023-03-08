import { FC } from "react"

import { Directory } from "../../../electron/database/schemas"

interface DirectoryListProps {
  directories: Directory[]
}

const DirectoryList : FC<DirectoryListProps> = ({ directories }) => {
  return (
    <div>
      {
        directories?.map((directory: any) => (
          <div key={directory.dataValues.id}>
            {directory.dataValues.name}
          </div>
        ))
      }
    </div>
  )
}

export default DirectoryList
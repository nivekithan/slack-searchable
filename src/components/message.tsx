import ago from "s-ago";

export type MessageProps = {
  message: string;
  userName: string;
  createdAt: Date;
};

export const Message = ({ message, userName, createdAt }: MessageProps) => {
  return (
    <div className="flex gap-y-3 flex-col text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-x-3">
          <Avatar userName={userName} />
          <h4 className="font-semibold">{userName}</h4>
        </div>
        <CreatedAt createdAt={createdAt} />
      </div>
      <p>{message}</p>
    </div>
  );
};

type AvatarProps = {
  userName: string;
};

const Avatar = ({ userName }: AvatarProps) => {
  const profileLetter = getFirstLetter(userName);

  return (
    <div className="bg-orange-300 text-blue-700 w-9 h-9 rounded-full p-2 grid place-items-center">
      {profileLetter}
    </div>
  );
};

type CreatedAtProps = {
  createdAt: Date;
};

export const CreatedAt = ({ createdAt }: CreatedAtProps) => {
  const formatTime = ago(createdAt);

  return <span className="text-gray-400">{formatTime}</span>;
};

const getFirstLetter = (word: string) => {
  const trimmedWord = word.trim();
  if (trimmedWord.length === 0) {
    return "";
  }

  // First letter can be an emoji or any other unicode which takes
  // more than one character.
  // To support those cases, we need to get the first codePoint and then
  // convert that to a string.
  return String.fromCodePoint(trimmedWord.codePointAt(0)!);
};

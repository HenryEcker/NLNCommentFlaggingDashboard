const DashboardHeader = ({totalComments, shouldDisplayTotal}: {
    totalComments: number;
    shouldDisplayTotal: boolean;
}): JSX.Element => {
    return (
        <div>
            <h2>NLN Comment Flagging Dashboard
                {
                    shouldDisplayTotal &&
                    <span title={'Total Number of Comments (without filters)'}> ({totalComments})</span>
                }
            </h2>
        </div>
    );
};

export default DashboardHeader;
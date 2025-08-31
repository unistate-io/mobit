import React, {useContext, useEffect, useState, useCallback} from "react"
import useIndexerHeight from "@/serves/useIndexerHeight"
import useBlockchainHeight from "@/serves/useBlockchainHeight"
import {CKBContext} from "@/providers/CKBProvider/CKBProvider"
import {LangContext} from "@/providers/LangProvider/LangProvider"

interface BlockHeightStatusProps {
    className?: string
}

const BlockHeightStatus: React.FC<BlockHeightStatusProps> = ({className = ""}) => {
    const {network} = useContext(CKBContext)
    const indexerHeight = useIndexerHeight()
    const blockchainHeight = useBlockchainHeight()
    const {lang} = useContext(LangContext)

    const [isExpanded, setIsExpanded] = useState(false)
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
    const [retryCount, setRetryCount] = useState(0)
    const [isRetrying, setIsRetrying] = useState(false)
    const [autoRefresh, setAutoRefresh] = useState<NodeJS.Timeout | null>(null)

    // Clear any existing auto-refresh timer
    const clearAutoRefresh = useCallback(() => {
        if (autoRefresh) {
            clearTimeout(autoRefresh)
            setAutoRefresh(null)
        }
    }, [autoRefresh])

    // Auto-retry logic for failed requests
    useEffect(() => {
        if ((indexerHeight.status === "error" || blockchainHeight.status === "error") && retryCount < 3) {
            const timer = setTimeout(() => {
                setIsRetrying(true)
                if (indexerHeight.status === "error") {
                    indexerHeight.refresh()
                }
                if (blockchainHeight.status === "error") {
                    blockchainHeight.refresh()
                }
                setRetryCount(prev => prev + 1)
                setTimeout(() => setIsRetrying(false), 1000)
            }, 5000) // Retry after 5 seconds

            return () => clearTimeout(timer)
        }
    }, [indexerHeight.status, blockchainHeight.status, retryCount, indexerHeight, blockchainHeight])

    // Reset retry count on successful data fetch
    useEffect(() => {
        if (indexerHeight.status === "complete" && blockchainHeight.status === "complete") {
            setRetryCount(0)
            clearAutoRefresh()
        }
    }, [indexerHeight.status, blockchainHeight.status, clearAutoRefresh])

    // Update last updated time when data changes
    useEffect(() => {
        if (indexerHeight.status === "complete" || blockchainHeight.status === "complete") {
            setLastUpdated(new Date())
        }
    }, [indexerHeight.status, blockchainHeight.status, indexerHeight.data, blockchainHeight.data])

    // Cleanup auto-refresh on unmount
    useEffect(() => {
        return () => clearAutoRefresh()
    }, [clearAutoRefresh])

    const isLoading = indexerHeight.status === "loading" || blockchainHeight.status === "loading" || isRetrying
    const hasError = indexerHeight.status === "error" || blockchainHeight.status === "error"

    const formatHeight = (height: string | undefined) => {
        if (!height) return "--"
        try {
            return parseInt(height).toLocaleString()
        } catch {
            return "--"
        }
    }

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {hour: "2-digit", minute: "2-digit"})
    }

    const getSyncStatus = () => {
        if (isLoading && retryCount > 0) return {status: "retrying", text: lang['Retrying']}
        if (isLoading) return {status: "syncing", text: lang['Syncing']}
        if (hasError) return {status: "error", text: retryCount >= 3 ? lang["Failed to fetch data"] : lang['Retrying']}

        const indexerNum = indexerHeight.data ? parseInt(indexerHeight.data.height) : 0
        const blockchainNum = blockchainHeight.data ? parseInt(blockchainHeight.data.height) : 0

        if (indexerNum === 0 || blockchainNum === 0) {
            return {status: "unknown", text: lang["Fetching"]}
        }

        const diff = blockchainNum - indexerNum
        if (diff === 0) {
            return {status: "synced", text: lang["Synced"]}
        } else if (diff <= 10) {
            return {status: "near_sync", text: lang['Nearly Done']([diff])}
        } else {
            return {status: "syncing", text: lang['Syncing ({0}%)']([diff])}
        }
    }

    const syncStatus = getSyncStatus()

    const getStatusColor = () => {
        switch (syncStatus.status) {
            case "synced":
                return "text-green-600"
            case "near_sync":
                return "text-yellow-600"
            case "syncing":
                return "text-blue-600"
            case "retrying":
                return "text-orange-600"
            case "error":
                return retryCount >= 3 ? "text-red-600" : "text-orange-600"
            default:
                return "text-gray-600"
        }
    }

    const getStatusDot = () => {
        switch (syncStatus.status) {
            case "synced":
                return "bg-green-500"
            case "near_sync":
                return "bg-yellow-500"
            case "syncing":
                return "bg-blue-500 animate-pulse"
            case "retrying":
                return "bg-orange-500 animate-pulse"
            case "error":
                return retryCount >= 3 ? "bg-red-500" : "bg-orange-500 animate-pulse"
            default:
                return "bg-gray-500"
        }
    }

    const getStatusTooltip = () => {
        if (retryCount >= 3) return "数据获取失败，请点击刷新重试"
        if (hasError) return "暂时无法获取数据，正在自动重试..."
        if (isLoading && retryCount > 0) return "重试连接中..."
        return "点击查看详情"
    }

    const handleManualRefresh = (e: React.MouseEvent) => {
        e.stopPropagation()
        clearAutoRefresh() // Clear any existing auto-refresh

        setRetryCount(0)
        setIsRetrying(true)

        // Set auto-refresh to retry after 10 seconds if manual refresh fails
        const refreshTimer = setTimeout(() => {
            if (indexerHeight.status === "error" || blockchainHeight.status === "error") {
                indexerHeight.refresh()
                blockchainHeight.refresh()
            }
        }, 10000)

        setAutoRefresh(refreshTimer)

        indexerHeight.refresh()
        blockchainHeight.refresh()
        setTimeout(() => setIsRetrying(false), 1000)
    }

    // Only show if we have at least one data source working
    if (indexerHeight.data || blockchainHeight.data || hasError) {
        return (
            <div className="flex items-center space-x-3">
                {/* Block height status with refresh */}
                <div
                    className={`relative inline-flex items-center space-x-2 text-xs text-gray-600 hover:text-gray-800 transition-colors cursor-pointer ${className}`}
                    onMouseEnter={() => setIsExpanded(true)}
                    onMouseLeave={() => setIsExpanded(false)}
                    title={getStatusTooltip()}
                >
                    <div className="flex items-center space-x-1">
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusDot()}`}></div>
                        <span className={getStatusColor()}>{syncStatus.text}</span>
                    </div>
                    <span className="text-gray-400">|</span>
                    <span className="font-mono text-gray-600">
                        {formatHeight(indexerHeight.data?.height)}/{formatHeight(blockchainHeight.data?.height)}
                    </span>

                    {/* Refresh button */}
                    <button
                        onClick={handleManualRefresh}
                        disabled={isRetrying}
                        className={`ml-1 p-1 rounded-full transition-colors ${
                            isRetrying
                                ? "text-gray-400 cursor-not-allowed"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                        }`}
                        title=""
                    >
                        {isRetrying ? (
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <style>{`
                                    .spin {
                                        animation: spin 1s linear infinite;
                                    }
                                    @keyframes spin {
                                        from { transform: rotate(0deg); }
                                        to { transform: rotate(360deg); }
                                    }
                                `}</style>
                                <path
                                    className="spin"
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        ) : (
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <path
                                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        )}
                    </button>

                    {/* Expanded tooltip */}
                    {isExpanded && (
                        <div className="absolute bottom-full right-0 mb-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[250px] text-gray-700">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${getStatusDot()}`}></div>
                                    <span className={`font-medium text-sm ${getStatusColor()}`}>{syncStatus.text}</span>
                                </div>
                                <div className="text-xs text-gray-400">{formatTime(lastUpdated)}</div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                                <div>
                                    <div className="text-gray-400 mb-1">{lang["Indexer Height"]}</div>
                                    <div className="font-mono text-green-600">
                                        {isLoading && !indexerHeight.data
                                            ? "loading..."
                                            : formatHeight(indexerHeight.data?.height)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 mb-1">{lang["Block Height"]}</div>
                                    <div className="font-mono text-blue-600">
                                        {isLoading && !blockchainHeight.data
                                            ? "loading..."
                                            : formatHeight(blockchainHeight.data?.height)}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 mb-1">{lang['Network']}</div>
                                    <div className="font-mono text-purple-600">
                                        {network === "mainnet" ? lang['Mainnet'] : lang['Testnet']}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-gray-400 mb-1">{lang["Gap"]}</div>
                                    <div className={`font-mono ${getStatusColor()}`}>
                                        {indexerHeight.data && blockchainHeight.data && !isLoading
                                            ? Math.abs(
                                                  parseInt(blockchainHeight.data.height) -
                                                      parseInt(indexerHeight.data.height)
                                              ).toLocaleString()
                                            : "--"}
                                    </div>
                                </div>
                            </div>

                            {hasError && (
                                <div className="mb-3 p-2 bg-gray-50 rounded text-xs">
                                    <div className="text-yellow-600">
                                        {retryCount >= 3 ? (
                                            <div className="flex items-center space-x-2">
                                                <span>⚠️</span>
                                                <span></span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center space-x-2">
                                                <span>🔄</span>
                                                <span>{lang["Retrying"]} ({retryCount}/3)...</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return null
}

export default BlockHeightStatus

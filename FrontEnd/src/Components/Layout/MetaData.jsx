import React from 'react'
import { Helmet } from 'react-helmet'

const MetaData = ({ title }) => {
    return (
        <Helmet>
            <title>{`${title} - L&F Spooky Mart`}</title>
        </Helmet>
    )
}

export default MetaData

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Search = () => {
    const [keyword, setKeyword] = useState('');
    const navigate = useNavigate();

    const searchHandler = (e) => {
        e.preventDefault();

        const searchTerm = keyword.trim();

        if (searchTerm) {
            navigate(`/products?keyword=${encodeURIComponent(searchTerm)}`);
        } else {
            navigate('/products');
        }
    };

    return (
        <form onSubmit={searchHandler}>
            <div className="input-group">
                <input
                    type="text"
                    id="search_field"
                    className="form-control"
                    placeholder="Enter Product Name ..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />

                <div className="input-group-append">
                    <button
                        id="search_btn"
                        className="btn"
                        type="submit"
                    >
                        <i className="fa fa-search" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        </form>
    );
};

export default Search;

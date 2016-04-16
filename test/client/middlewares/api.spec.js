import { Schema, arrayOf } from 'normalizr';
import { assert } from 'chai';
import assign from 'lodash/assign';
import nock from 'nock';
import configureMockStore from 'redux-mock-store';
import apiMiddleware, { CALL_API } from 'client/middlewares/api';

const middlewares = [ apiMiddleware ];
const mockStore = configureMockStore(middlewares);

function testApi(action, expectedActions, cb) {
    const store = mockStore();
    const items = [ { id: 1, title: 'test' } ];
    const assertion = () => cb ? cb.bind(null, store.getActions) : assert.deepEqual(store.getActions(), expectedActions);

    nock('http://localhost')
        .get('/test')
        .reply(200, { success: true, data: items });

    return store.dispatch(action).then(assertion);
};

describe('apiMiddleware', () => {
    beforeEach(() => {
        nock.cleanAll();
    });

    it('should call request to api, dispatch REQUEST and SUCCESS action', () => {
        const action = {
            [CALL_API]: {
                types: [ 'REQUEST', 'SUCCESS', 'ERROR' ],
                endpoint: '/test',
            }
        };

        const expectedActions = [
            { type: 'REQUEST' },
            { type: 'SUCCESS', payload: [ { id: 1, title: 'test' } ] }
        ];

        return testApi(action, expectedActions);
    });

    it('should normalize JSON response, when schema is provided', () => {
        const schema = new Schema('test');
        const action = {
            [CALL_API]: {
                types: [ 'REQUEST', 'SUCCESS', 'ERROR' ],
                endpoint: '/test',
                schema: arrayOf(schema)
            }
        };

        const normalized = {
            result: [ 1 ],
            entities: {
                test: {
                    1: { id: 1, title: 'test' }
                }
            }
        };

        const expectedActions = [
            { type: 'REQUEST' },
            { type: 'SUCCESS', payload: normalized }
        ];

        return testApi(action, expectedActions);
    });

    it('should dispatch ERROR action when request returned an error', () => {
        const action = {
            [CALL_API]: {
                types: [ 'REQUEST', 'SUCCESS', 'ERROR' ],
                endpoint: '/unknown',
            }
        };

        return testApi(action, null, (getActions) => {
            const actions = getActions();
            assert.equal(actions[0], { type: 'REQUEST' });
            assert.equal(actions[0], { type: 'ERROR' });
        });
    });
});